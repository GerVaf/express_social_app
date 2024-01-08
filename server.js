const express = require("express");
const cors = require("cors"); // Include CORS
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { connectDb } = require("./db/mongo");
const userRouter = require("./router/userRouter");
const loginSignUpRouter = require("./router/loginSignUpRouter");
const blogRouter = require("./router/blogRouter");
const testing = require("./router/testRouter");
const app = express();
const port = 8000;

const corsOptions = {
  origin: "http://localhost:5173",
};
app.use(cors(corsOptions));

connectDb()
  .then(() => {
    app.use(express.json());

    app.use("/api/v1/blog", blogRouter);
    app.use("/api/v1/user", userRouter);
    app.use("/api/v1", loginSignUpRouter);
    // app.use("/api/v1/img", testing);
    app.use(notFound);
    app.use(errorHandler);

    // Listen on all network interfaces
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err, "Connection error!");
  });
