const { Server } = require("socket.io");

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

    const addUserInfo = (userInfo, socketId) => {
      // Prevent duplicate entries
      const existingUserIndex = joinUser.findIndex(
        (user) => user.userInfo._id === userInfo._id
      );
      if (existingUserIndex !== -1) {
        joinUser[existingUserIndex].socketId = socketId;
      } else {
        joinUser.push({ userInfo, socketId });
      }
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
    };

    const sendMessage = (senderSocketId, receiverId, messageContent) => {
      const sender = joinUser.find((user) => user.socketId === senderSocketId);
      const receiver = joinUser.find(
        (user) => user.userInfo._id === receiverId
      );

      if (sender && receiver) {
        const message = {
          senderId: sender.userInfo._id,
          receiverId: receiver.userInfo._id,
          content: messageContent,
          timestamp: new Date(),
        };

        // Emit the message to the receiver's socket
        io.to(receiver.socketId).emit("receiveMessage", message);

        // Also send a confirmation back to the sender with the message
        io.to(senderSocketId).emit("messageSent", message);
      } else {
        console.log("Receiver not found or offline");
        io.to(senderSocketId).emit(
          "messageFailed",
          "Receiver not found or offline"
        );
      }
    };

    io.on("connection", (socket) => {
      console.log(`New connection: ${socket.id}`);

      socket.on("senderData", (data) => {
        console.log("Received senderData:", data);
        addUserInfo(data, socket.id);
        socket.emit("activeUser", joinUser);
        console.log("joinUser after senderData:", joinUser);
      });

      socket.on("newMessage", ({ receiverId, message }) => {
        sendMessage(socket.id, receiverId, message);
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
