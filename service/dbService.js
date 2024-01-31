const { getDb } = require("../db/mongo");

const getCollection = (collectionName) => async () =>
  await getDb().collection(collectionName);

const saveMessageToDatabase = async (messageData) => {
  try {
    const messagesCollection =await getCollection("message")();

    const result = await messagesCollection.insertOne(messageData);
    console.log("Message saved successfully", result);
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};

module.exports = {
  getBlogCollection: getCollection("blog"),
  getUserCollection: getCollection("user"),
  getCommentCollection: getCollection("comment"),
  getMessageCollection: getCollection("message"),
  saveMessageToDatabase,
};
