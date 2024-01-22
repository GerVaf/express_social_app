const { getDb } = require("../db/mongo");

const getCollection = (collectionName) => async () =>
  await getDb().collection(collectionName);

module.exports = {
  getBlogCollection: getCollection("blog"),
  getUserCollection: getCollection("user"),
  getCommentCollection: getCollection("comment"),
};
