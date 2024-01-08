const { getDb } = require("../db/mongo");
const { BadRequest } = require("../utils/AppError");
const { tryCatch } = require("../utils/tryCatch");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

exports.login = tryCatch(async (req, res) => {
  const collection = await getDb().collection("user");
  const users = await collection.find({}).toArray();
  //   console.log(users)
  const { email, password } = req.body;

  const existLoginUser = users.find(
    (us) => us.email === email && bcrypt.compareSync(password, us.info.password)
  );

  if (!existLoginUser) {
    throw new BadRequest("Invalid password or email !!");
  }

  var token = jwt.sign({ userId: existLoginUser._id }, process.env.JWT_SECRET);
  // console.log("id", existLoginUser._id);
  res
    .status(200)
    .json({ message: "Login Successfully!!", token, data: existLoginUser });
});

exports.register = tryCatch(async (req, res) => {
  const collection = await getDb().collection("user");

  const {
    name,
    email,
    info: { password, con_password },
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
  const hashPassword = bcrypt.hashSync(password, 10);

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

  res.status(201).json({ message: "Registered successfully !", data: result });
});
