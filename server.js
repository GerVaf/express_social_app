const express = require("express");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { connectDb } = require("./db/mongo");
const userRouter = require("./router/userRouter");
const loginSignUpRouter = require("./router/loginSignUpRouter");
const blogRouter = require("./router/blogRouter");
const app = express();
const port = 8000;

connectDb()
  .then(() => {
    app.use(express.json());

    app.use("/api/v1/blog",blogRouter)
    app.use("/api/v1/user", userRouter);
    app.use("/api/v1", loginSignUpRouter);
    app.use(notFound);
    app.use(errorHandler);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err, "Connection error!");
  });
