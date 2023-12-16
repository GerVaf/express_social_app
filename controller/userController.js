const { ObjectId } = require("mongodb");
const { getDb } = require("../db/mongo");
const { NotFound, BadRequest } = require("../utils/AppError");
const { tryCatch } = require("../utils/tryCatch");

exports.getUser = tryCatch(async (req, res) => {
  const db = getDb();
  const collection = await db.collection("user");

  const result = await collection.find({}).toArray();
  res.status(200).json({ message: true, data: result });
  // console.log(result);
});

exports.createUser = tryCatch(async (req, res) => {
  const collection = await getDb().collection("user");

  const { name, email } = req.body;
  const { password, con_password } = req.body.info;
  if (!name || !email || !password || !con_password) {
    throw new BadRequest("Fill all of this field !!");
  } else if (!email.includes("@")) {
    throw new BadRequest("email is not definied!");
  } else if (password.length < 5) {
    throw new BadRequest("Length must have at least 5!");
  } else if (password !== con_password) {
    throw new BadRequest("password and confirm password does not match !!");
  }

  const newUserData = {
    name,
    email,
    info: {
      password,
      con_password,
    },
  };

  // console.log(newUserData);
  const result = await collection.insertOne(newUserData);

  res.status(201).json({ message: "Created !", data: result });
});

exports.editUser = tryCatch(async (req, res) => {
  const collection = await getDb().collection("user");

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
  const collection = await getDb().collection("user");

  if (!ObjectId.isValid(req.params.id)) {
    throw new NotFound(`Id ${req.params.id} is not exist !!`);
  }
  const id = new ObjectId(req.params.id);
  // console.log(id);
  const result = await collection.deleteOne({ _id: id });
  console.log(result);
  if (result.acknowledged === true) {
    return res
      .status(200)
      .json({ message: "Delete Successfully", data: result });
  }
});
