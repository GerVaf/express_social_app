const { getBlogCollection } = require("./dbService");

const isBlogExist = async (_id) => {
  const collection = await getBlogCollection();

  const result = await collection.findOne({ _id });
  return result 
};

module.exports = { isBlogExist };
