const { ObjectId } = require("mongodb");
const { getDb } = require("../db/mongo");
const { NotFound, BadRequest } = require("../utils/AppError");
const { tryCatch } = require("../utils/tryCatch");

const getBlogCollection = async () => await getDb().collection("blog");
const getUserCollection = async () => await getDb().collection("user");

exports.getBlog = tryCatch(async (req, res) => {
  const collection = await getBlogCollection();
  const result = await collection.find({}).toArray();
  res.status(200).json({ data: result });
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
  // console.log(ownerId)
  if (!ObjectId.isValid(ownerId)) {
    return res.status(400).json({ message: "Owner ID is required" });
  }
  const blogOwner = new ObjectId(ownerId);

  // search for blog owner
  const result = await userCollection
    .aggregate([
      { $match: { _id: blogOwner } },
      {
        $lookup: {
          from: "blog",
          localField: "_id",
          foreignField: "blogOwner",
          as: "blogs",
        },
      },
      { $project: { blogOwner: 0, info: 0 } },
    ])
    .toArray();

  res.status(200).json({ message: "Here's owner's bolgs!!", data: result });
});

exports.getBlogOwner = tryCatch(async (req, res) => {
  const userCollection = await getUserCollection();
  const { userId } = req.query;

  if (!ObjectId.isValid(userId))
    throw new BadRequest("Id is something went wrong!");

  const whichUser = new ObjectId(userId);

  const result = await userCollection.findOne({ _id: whichUser });
  res.status(200).json({ message: "Here's the owner of blog", data: result });
});

exports.createBlog = tryCatch(async (req, res) => {
  const collection = await getBlogCollection();
  const blogData = { ...req.body };
  blogData.blogOwner = new ObjectId(req.activeId);
  // console.log(blogData)
  const result = await collection.insertOne(blogData);
  // console.log(result);
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
