const { ObjectId } = require("mongodb");
const { getDb } = require("../db/mongo");
const { NotFound, BadRequest } = require("../utils/AppError");
const { tryCatch } = require("../utils/tryCatch");
const { isBlogExist } = require("../service/blogService");
const { isUserExist } = require("../service/userService");

const getBlogCollection = async () => await getDb().collection("blog");
const getUserCollection = async () => await getDb().collection("user");
const getCommentCollection = async () => await getDb().collection("comment");

exports.getBlog = tryCatch(async (req, res) => {
  const blogCollection = await getBlogCollection();

  // Use aggregation with $lookup to join comments and owner information
  const result = await blogCollection
    .aggregate([
      {
        $lookup: {
          from: "user",
          localField: "blogOwner",
          foreignField: "_id",
          as: "ownerInfo",
        },
      },
      {
        $unwind: "$ownerInfo",
      },
      {
        $lookup: {
          from: "comment",
          localField: "_id",
          foreignField: "blogId",
          as: "comments",
          pipeline: [
            {
              $lookup: {
                from: "user",
                localField: "userId",
                foreignField: "_id",
                as: "profileInfo",
              },
            },
            { $project: { userId: 0 } },
          ],
        },
      },
      {
        $project: {
          "comments.blogId": 0,
          "comments.profileInfo.info": 0,
          "blogOwner": 0,
          "ownerInfo.info": 0,
          // ownerEmail: "$ownerInfo.email",
        },
      },
    ])
    .toArray();

  res.status(200).json({ data: result });
});

exports.singleBlog = tryCatch(async (req, res) => {
  const collection = await getBlogCollection();

  const { _id } = req.body;
  if (!ObjectId.isValid(_id)) {
    throw new BadRequest("Put the right id");
  }
  const isExisted = await collection.findOne({ _id: new ObjectId(_id) });

  if (!isExisted) {
    throw new BadRequest("This id does not exist");
  }

  const result = await collection
    .aggregate([
      { $match: { _id: new ObjectId(_id) } },
      {
        $lookup: {
          from: "comment",
          localField: "_id",
          foreignField: "blogId",
          as: "comments",
        },
      },
      { $project: { "comments.blogId": 0 } },
    ])
    .toArray();

  console.log(result);
  res.status(200).json({ message: "Here is the fking blog!", data: result });
});

exports.getOwnerBlog = tryCatch(async (req, res) => {
  const userCollection = await getUserCollection();
  const { ownerId } = req.body;

  if(!ObjectId.isValid(ownerId)){
    throw new BadRequest("Id is not invalid!")
  }
  const blogOwner = new ObjectId(ownerId);


  if ((await isUserExist(blogOwner)) === null) {
    throw new NotFound(`This account does not exist !!`);
  }

  // Search for blog owner and their blogs including comments
  const result = await userCollection
    .aggregate([
      { $match: { _id: blogOwner } },
      {
        $lookup: {
          from: "blog",
          localField: "_id",
          foreignField: "blogOwner",
          as: "blogs",
          pipeline: [
            {
              $lookup: {
                from: "comment",
                localField: "_id",
                foreignField: "blogId",
                as: "comments",
              },
            },
            {
              $project: {
                "comments.blogId": 0,
                "comments._id": 0,
              },
            },
          ],
        },
      },
      { $project: { blogOwner: 0, info: 0 } },
    ])
    .toArray();

  res.status(200).json({ message: "Here's the owner's blogs!", data: result });
});

exports.getBlogOwner = tryCatch(async (req, res) => {
  const userCollection = await getUserCollection();
  const { userId } = req.query;

  if (!ObjectId.isValid(userId))
    throw new BadRequest("Id is something went wrong!");

  const whichUser = new ObjectId(userId);

  const result = await userCollection.findOne(
    { _id: whichUser },
    { projection: { info: 0 } }
  );
  res.status(200).json({ message: "Here's the owner of blog", data: result });
});

exports.createBlog = tryCatch(async (req, res) => {
  const collection = await getBlogCollection();
  const blogData = {
    ...req.body,
    blogImg: req.blogImg,
    blogOwner: new ObjectId(req.activeId),
  };

  if ((await isUserExist(blogData.blogOwner)) === null) {
    throw new NotFound(`Your account does not exist !!`);
  }

  // Simplified date formatting
  const now = new Date();
  const formattedDate = now
    .toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/(\d+)\/(\d+)\/(\d+),/, "$3-$1-$2");
  blogData.date = formattedDate;

  const result = await collection.insertOne(blogData);
  res.status(201).json({ message: "Blog Created Successfully", data: result });
});

exports.deleteBlog = tryCatch(async (req, res) => {
  const collection = await getBlogCollection();
  const { id } = req.params;
  if (!ObjectId.isValid(id)) throw new NotFound(`Id ${id} does not exist!`);

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  // console.log(result);
  if (result.acknowledged) {
    res
      .status(200)
      .json({ message: "Blog Deleted Successfully", data: result });
  }
});

exports.likeBlog = tryCatch(async (req, res) => {
  const blogCollection = await getBlogCollection();

  const { blogId } = req.body;
  const userId = req.activeId;

  if ((await isUserExist(new ObjectId(userId))) === null) {
    throw new NotFound(`User does not exist !!`);
  }
  if ((await isBlogExist(new ObjectId(blogId))) === null) {
    throw new NotFound(`Blog does not exist !!`);
  }

  if (!ObjectId.isValid(blogId))
    throw new BadRequest("This user is not exist!!");
  // Check if userId already exists in the like array
  const blog = await blogCollection.findOne({
    _id: new ObjectId(blogId),
    like: userId,
  });

  let updateResult;
  if (blog) {
    // If userId exists in the like array, remove it
    updateResult = await blogCollection.updateOne(
      { _id: new ObjectId(blogId) },
      { $pull: { like: userId } } // Removes userId from the like array
    );
  } else {
    // If userId does not exist in the like array, add it
    updateResult = await blogCollection.updateOne(
      { _id: new ObjectId(blogId) },
      { $addToSet: { like: userId } } // Adds userId to the like array, only if it's not already present
    );
  }

  // You can then respond based on the update result
  if (updateResult.modifiedCount === 1) {
    res.status(201).json({ message: "Blog like updated successfully!" });
  } else {
    res.status(500).json({ message: "Unable to update the post." });
  }
});

exports.getComment = tryCatch(async (req, res) => {
  const commentCollection = await getCommentCollection();
  const result = await commentCollection.find({}).toArray();
  res.status(200).json({ message: "Here's comment!", data: result });
});

exports.commentBlog = tryCatch(async (req, res) => {
  const commentCollection = await getCommentCollection();

  const { blogId, userComment } = req.body;
  const userId = new ObjectId(req.activeId);

  // console.log(blogId, userComment);
  if ((await isUserExist(userId)) === null) {
    throw new NotFound(`User does not exist !!`);
  }

  if ((await isBlogExist(new ObjectId(blogId))) === null) {
    throw new BadRequest("This blog is not exist!");
  }

  const commentResult = await commentCollection.insertOne({
    blogId: new ObjectId(blogId),
    userId,
    userComment,
  });

  // console.log(commentResult);

  res.status(201).json({
    message: `You comment on ${blogId} this post`,
    data: commentResult,
  });
});

exports.deleteComment = tryCatch(async (req, res) => {
  const collection = await getCommentCollection();
  const {
    activeId,
    body: { commentId },
  } = req;

  console.log(`Active ID: ${activeId}, Comment ID: ${commentId}`);

  if (!ObjectId.isValid(commentId)) {
    throw new BadRequest("Invalid comment ID!");
  }

  // First check if the comment exists and belongs to the active user
  const existingComment = await collection.findOne({
    _id: new ObjectId(commentId),
    userId: new ObjectId(activeId),
  });

  if (!existingComment) {
    throw new BadRequest("No matching comment found or you are not the owner!");
  }

  // If the comment exists, proceed with deletion
  await collection.findOneAndDelete({
    _id: new ObjectId(commentId),
    userId: new ObjectId(activeId),
  });

  res.status(200).json({ message: "Comment deleted successfully!" });
});

exports.editComment = tryCatch(async (req, res) => {
  const collection = await getCommentCollection();
  const {
    activeId,
    body: { commentId, userComment },
  } = req;

  console.log(`Active ID: ${activeId}, Comment ID: ${commentId}`);

  if (!ObjectId.isValid(commentId)) {
    throw new BadRequest("Invalid comment ID!");
  }

  // First check if the comment exists and belongs to the active user
  const existingOrOwerComment = await collection.findOne({
    _id: new ObjectId(commentId),
    userId: new ObjectId(activeId),
  });

  if (!existingOrOwerComment) {
    throw new BadRequest("No matching comment found or you are not the owner!");
  }

  // If the comment exists, proceed with deletion
  const update = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(commentId),
      userId: new ObjectId(activeId),
    },
    {
      $set: { userComment },
    }
  );

  console.log(update);

  res.status(200).json({ message: "Comment edited successfully!" });
});
