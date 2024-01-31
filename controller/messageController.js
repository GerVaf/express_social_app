const { getMessageCollection } = require("../service/dbService");
const { tryCatch } = require("../utils/tryCatch");

exports.sendMessage = tryCatch(async (req, res) => {
  const collection = await getMessageCollection();
  const { senderId, receiverId } = req.body;

  const query = {
    $or: [
      { senderId: senderId, receiverId: receiverId },
      { senderId: receiverId, receiverId: senderId }
    ]
  };

  const result = await collection.find(query).toArray();
  
  res.status(200).json({ messages: result });
});
