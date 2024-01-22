const { ObjectId } = require("mongodb");
const { NotFound, BadRequest } = require("../utils/AppError");
const { tryCatch } = require("../utils/tryCatch");

const bcrypt = require("bcrypt");
const {
  getUserCollection,
  getBlogCollection,
  getCommentCollection,
} = require("../service/dbService");
const { isUserExist } = require("../service/userService");
const { startSession } = require("../db/mongo");

exports.getUser = tryCatch(async (req, res) => {
  const collection = await getUserCollection();

  const result = await collection.find({}).toArray();
  // console.log(req)
  res.status(200).json({ message: true, data: result });
  // console.log(result);
});

exports.createUser = tryCatch(async (req, res) => {
  const collection = await getUserCollection();

  const {
    name,
    email,
    info: { password, con_password },
    followers: [],
    following: [],
  } = req.body;

  const users = await collection.find({}).toArray();

  const existUser = users.find((us) => us.email === email);

  // VALIDATION
  if (existUser) {
    throw new BadRequest("Email already exist !!");
  } else if (!name || !email || !password || !con_password) {
    throw new BadRequest("Fill all of this field !!");
  } else if (!email.includes("@")) {
    throw new BadRequest("email is not definied!");
  } else if (password.length < 5) {
    throw new BadRequest("Length must have at least 5!");
  } else if (password !== con_password) {
    throw new BadRequest("password and confirm password does not match !!");
  }

  // for store hash passwod -
  const hashPassword = bcrypt.hashSync(password, 5);

  const newUserData = {
    name,
    email,
    info: {
      password: hashPassword,
      con_password: hashPassword,
    },
  };

  // console.log(newUserData);
  const result = await collection.insertOne(newUserData);

  res.status(201).json({ message: "Created successfully !", data: result });
});

exports.editUser = tryCatch(async (req, res) => {
  const collection = await getUserCollection();

  const { _id, ...updateFields } = req.body;
  // console.log(req.body)
  // console.log(ObjectId.isValid(_id))
  if (!ObjectId.isValid(_id)) {
    throw new NotFound(`Id ${_id} is not exist !!`);
  }
  const id = new ObjectId(_id);

  // console.log(updateFields);
  const result = await collection.updateOne(
    { _id: id },
    { $set: updateFields },
    { new: true }
  );
  // console.log(result);

  res.status(200).json({ message: "Updated Successfully!", data: result });
});

exports.deleteUser = tryCatch(async (req, res) => {
  const userCollection = await getUserCollection();
  const blogCollection = await getBlogCollection();
  const commentCollection = await getCommentCollection();
  const session = await startSession();

  const { id } = req.params;
  const _id = new ObjectId(id);

  if ((await isUserExist(_id)) === null) {
    throw new NotFound(`Id ${id} does not exist !!`);
  }

  let result;

  await session.withTransaction(async () => {
    // Delete the user's blogs and comments
    await blogCollection.deleteMany({ blogOwner: _id }, { session });
    await commentCollection.deleteMany({ userId: _id }, { session });

    // Remove the user's ID from the likes of all blogs
    await blogCollection.updateMany({}, { $pull: { like: id } }, { session });
    await userCollection.updateMany(
      {},
      { $pull: { followers: id } },
      { session }
    );
    // Delete the user
    result = await userCollection.deleteOne({ _id }, { session });
  });

  console.log(result);
  if (result.acknowledged === true) {
    return res
      .status(200)
      .json({ message: "Deleted Successfully", data: result });
  } else {
    // Handle the case where the transaction was not successful
    throw new Error("Could not delete user and related data");
  }
});

exports.userFollow = tryCatch(async (req, res) => {
  const collection = await getUserCollection();
  const { userId } = req.body;
  const followerId = req.activeId;

  if (userId === followerId) {
    throw new BadRequest("Cannot follow or unfollow yourself");
  }
  if ((await isUserExist(new ObjectId(userId))) === null) {
    throw new NotFound(`Your account was delted !!`);
  }

  // Find the user to be followed or unfollowed
  const userToFollow = await collection.findOne({ _id: new ObjectId(userId) });
  console.log(userToFollow);
  // Check if the user to follow exists
  if (!userToFollow) {
    return res.status(404).json({ message: "User to follow not found" });
  }

  const isFollowing = userToFollow.followers?.includes(followerId);

  let followUpdate, followingUpdate;
  if (isFollowing) {
    // If already following, then unfollow
    followUpdate = { $pull: { followers: followerId } };
    followingUpdate = { $pull: { following: userId } };
  } else {
    // If not following, then follow
    followUpdate = { $addToSet: { followers: followerId } };
    followingUpdate = { $addToSet: { following: userId } };
  }

  // Update the 'followers' array of the followed user
  const followResult = await collection.updateOne(
    { _id: new ObjectId(userId) },
    followUpdate
  );

  // Update the 'following' array of the follower
  const followingResult = await collection.updateOne(
    { _id: new ObjectId(followerId) },
    followingUpdate
  );

  res.status(200).json({ followResult, followingResult });
});

exports.userDetail = tryCatch(async (req, res) => {
  const collection = await getUserCollection();
  const { userId } = req.body;

  const result = await collection.findOne({ _id: new ObjectId(userId) });
  res.status(200).json({ message: "Here's detail", data: result });
});
