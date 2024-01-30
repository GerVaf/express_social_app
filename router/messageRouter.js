const { Router } = require("express");
const { sendMessage } = require("../controller/messageController");

const messageRouter = Router();

messageRouter.route("/").get(sendMessage);

module.exports = messageRouter;
