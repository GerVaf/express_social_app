const { Router } = require("express");
const {
  getUser,
  createUser,
  editUser,
  deleteUser,
  userFollow,
  userDetail,
} = require("../controller/userController");
const { authorize } = require("../middleware/authorize");

const userRouter = Router();
userRouter.route("/").get(authorize, getUser);
userRouter.route("/create").post(createUser);
userRouter.route("/edit").put(editUser);
userRouter.route("/delete/:id").delete(deleteUser);

userRouter.route("/account/following").post(authorize, userFollow);
userRouter.route("/account/detail").post(authorize, userDetail);

module.exports = userRouter;
