const { Server } = require("socket.io");
const { saveMessageToDatabase } = require("./dbService");

let io = null;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    });

    let joinUser = [];

    const addActiveUserInfo = (userInfo, socketId) => {
      // Prevent duplicate entries
      const existingUserIndex = joinUser.findIndex(
        (user) => user.userInfo?._id === userInfo?._id
      );
      if (existingUserIndex !== -1) {
        joinUser[existingUserIndex].socketId = socketId;
      } else {
        joinUser.push({ userInfo, socketId });
      }

      io.emit("showActiveUser", joinUser);
    };

    const removeActiveUser = (socketId) => {
      // Efficiently remove user and log the action
      const userIndex = joinUser.findIndex(
        (user) => user.socketId === socketId
      );
      if (userIndex !== -1) {
        console.log(`Removing user: ${joinUser[userIndex].userInfo.email}`);
        joinUser.splice(userIndex, 1);
      }

      // realtime unactive for frontend
      io.emit("showActiveUser", joinUser);
    };

    const sendMessage = async (senderId, receiverId, messageContent) => {
      const sender = joinUser.find((user) => user?.userInfo?._id === senderId);
      const receiver = joinUser.find(
        (user) => user?.userInfo?._id === receiverId
      );

      const message = {
        senderId: senderId,
        receiverId: receiverId,
        content: messageContent,
        timestamp: new Date(),
        isRead: false, 
      };

      try {
        await saveMessageToDatabase(message); 

        // If receiver is online, emit the message to the receiver's socket
        if (receiver) {
          io.to(receiver?.socketId).emit("receiveMessage", message);
        }

        // Send a confirmation back to the sender
        io.to(sender?.socketId).emit("messageSent", message);
      } catch (error) {
        console.error("Error saving message: ", error);
        io.to(sender?.socketId).emit("messageFailed", "Failed to send message");
      }
    };

    io.on("connection", (socket) => {
      console.log(`New connection: ${socket.id}`);

      socket.on("activeUser", (data) => {
        // console.log(data);
        addActiveUserInfo(data, socket.id);
        // console.log(joinUser);
      });

      // socket.on("senderData", (data) => {
      //   console.log("Received senderData:", data);
      //   addUserInfo(data, socket.id);
      //   socket.emit("activeUser", joinUser);
      //   console.log("joinUser after senderData:", joinUser);
      // });

      socket.on("Message", ({ senderId, receiverId, message }) => {
        sendMessage(senderId, receiverId, message);
        console.log(senderId, receiverId, message);
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        removeActiveUser(socket.id);
        console.log(joinUser);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
