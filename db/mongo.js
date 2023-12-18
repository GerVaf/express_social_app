require('dotenv').config()
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
let dbInstance;

async function connectDb() {
  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    console.log("con mongo");

    dbInstance = client.db(dbName);
    return dbInstance;
  } catch (err) {
    console.log("Connect error!", err);
    throw err;
  }
}

function getDb() {
  if (!dbInstance) {
    throw new Error("DataBase not initialized!");
  }
  return dbInstance;
}

module.exports = { getDb, connectDb };
