const express = require("express");
const http = require("http");
const cors = require("cors");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { connectDb } = require("./db/mongo");
const userRouter = require("./router/userRouter");
const loginSignUpRouter = require("./router/loginSignUpRouter");
const blogRouter = require("./router/blogRouter");
const socketService = require("./service/socketService");
const messageRouter = require("./router/messageRouter");
const app = express();
const port = 8000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://social-blogs.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server

connectDb().then(() => {
  app.use(express.json());
  socketService.init(server);

  // Register routers
  app.use("/api/v1/blog", blogRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1", loginSignUpRouter);
  app.use("/api/v1/message", messageRouter);

  // Error handling middlewares
  app.use(notFound);
  app.use(errorHandler);

  // Server and Socket.IO listener
  server.listen(port, () => {
    console.log(`Server and Socket.IO running on port ${port}`);
  });
}).catch((err) => {
  console.error("Connection error:", err);
});
