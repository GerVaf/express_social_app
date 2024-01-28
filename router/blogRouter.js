const { Router } = require("express");
const {
  createBlog,
  getBlog,
  deleteBlog,
  getOwnerBlog,
  getBlogOwner,
  likeBlog,
  commentBlog,
  getComment,
  singleBlog,
  deleteComment,
  editComment,
} = require("../controller/blogController");
const { authorize } = require("../middleware/authorize");
const {
  multerUploadMiddleware,
  cloudUploadMiddleware,
} = require("../middleware/imageUpload");

const blogRouter = Router();

blogRouter.route("/").get(getBlog);
blogRouter.route("/single-blog/:_id").get(singleBlog);
blogRouter.route("/owner-blogs").post(getOwnerBlog);
blogRouter.route("/blogs-owner").post(getBlogOwner);
blogRouter
  .route("/create")
  .post(authorize, multerUploadMiddleware, cloudUploadMiddleware, createBlog);
blogRouter.route("/delete/:id").delete(deleteBlog);
blogRouter.route("/like").post(authorize,likeBlog)
blogRouter.route("/comment").get(getComment)
blogRouter.route("/comment").post(authorize,commentBlog)

blogRouter.route("/comment/delete").delete(authorize,deleteComment)
blogRouter.route("/comment/edit").put(authorize,editComment)

module.exports = blogRouter;
