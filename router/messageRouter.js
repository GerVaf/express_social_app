const { Router } = require("express");
const { sendMessage } = require("../controller/messageController");

const messageRouter = Router();

messageRouter.route("/").post(sendMessage);

module.exports = messageRouter;
