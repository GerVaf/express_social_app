const { Router } = require("express");
const {
  createBlog,
  getBlog,
  deleteBlog,
  getOwnerBlog,
  getBlogOwner,
} = require("../controller/blogController");
const { authorize } = require("../middleware/authorize");

const blogRouter = Router();

blogRouter.route("/").get(getBlog);
blogRouter.route("/owner-blogs").post(getOwnerBlog);
blogRouter.route("/blogs-owner").post(getBlogOwner);
blogRouter.route("/create").post(authorize, createBlog);
blogRouter.route("/delete/:id").delete(deleteBlog);

module.exports = blogRouter;
