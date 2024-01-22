const { getUserCollection } = require("./dbService");

const isUserExist = async (_id) => {
  const collection = await getUserCollection();

  const result = await collection.findOne({ _id });
  return result;
};

module.exports = { isUserExist };
