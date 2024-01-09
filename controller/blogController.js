const { ObjectId } = require("mongodb");
const { getDb } = require("../db/mongo");
const { NotFound, BadRequest } = require("../utils/AppError");
const { tryCatch } = require("../utils/tryCatch");

const getBlogCollection = async () => await getDb().collection("blog");
const getUserCollection = async () => await getDb().collection("user");
const getCommentCollection = async () => await getDb().collection("comment");

exports.getBlog = tryCatch(async (req, res) => {
  const blogCollection = await getBlogCollection();

  // Use aggregation with $lookup to join comments
  const result = await blogCollection
    .aggregate([
      {
        $lookup: {
          from: "comment",
          localField: "_id",
          foreignField: "blogId",
          as: "comments",
        },
      },
      { $project: { "comments.blogId": 0, "comments._id": 0 } },
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

  res.status(200).json({ message: "Here is the fking blog!", data: isExisted });
});

// exports.getOwnerBlog = tryCatch(async (req, res) => {
//   const blogCollection = await getBlogCollection();
//   const { ownerId } = req.body;
//   // console.log(ownerId)
//   if (!ownerId) {
//     return res.status(400).json({ message: "Owner ID is required" });
//   }
//   // search for blog owner
//   const result = await blogCollection
//     .aggregate([
//       { $match: { blogOwner: ownerId } },
//       { $project: { blogOwner: 0 } },
//     ])
//     .toArray();

//   res.status(200).json({ message: "Here's owner's bolgs!!", data: result });
// });

exports.getOwnerBlog = tryCatch(async (req, res) => {
  const userCollection = await getUserCollection();
  const { ownerId } = req.body;

  if (!ObjectId.isValid(ownerId)) {
    throw new BadRequest("Owner ID is required");
  }

  const blogOwner = new ObjectId(ownerId);

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

  // Convert hashTag to an array of strings
  // if (req.blog && req.blog.hashTag) {
  //   blogData.hashTag = req.blog.hashTag.split(",").map((tag) => tag.trim());
  // }

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

  const commentResult = await commentCollection.insertOne({
    blogId: new ObjectId(blogId),
    userId,
    userComment,
  });

  console.log(commentResult);

  res.status(201).json({
    message: `You comment on ${blogId} this post`,
    data: commentResult,
  });
});
