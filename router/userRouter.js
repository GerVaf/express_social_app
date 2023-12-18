const { Router } = require("express");
const {
  getUser,
  createUser,
  editUser,
  deleteUser,
} = require("../controller/userController");
const { authorize } = require("../middleware/authorize");

const userRouter = Router();
userRouter.route("/").get(authorize,getUser);
userRouter.route("/create").post(createUser);
userRouter.route("/edit").put(editUser);
userRouter.route("/delete/:id").delete(deleteUser);

module.exports = userRouter
