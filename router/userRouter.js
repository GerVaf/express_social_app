const { Router } = require("express");
const {
  getUser,
  createUser,
  editUser,
  deleteUser,
} = require("../controller/userController");

const userRouter = Router();
userRouter.route("/").get(getUser);
userRouter.route("/create").post(createUser);
userRouter.route("/edit").put(editUser);
userRouter.route("/delete/:id").delete(deleteUser);

module.exports = userRouter
