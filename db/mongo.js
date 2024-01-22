require('dotenv').config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

let dbInstance;
let mongoClientInstance; // Store the MongoClient instance

async function connectDb() {
  try {
    const client = new MongoClient(uri, {
      serverApi: ServerApiVersion.v1
      // Removed the unsupported options
    });
    await client.connect();
    console.log("Connected to MongoDB");

    dbInstance = client.db(dbName);
    mongoClientInstance = client;
    return dbInstance;
  } catch (err) {
    console.log("Connection error!", err);
    throw err;
  }
}

function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized!");
  }
  return dbInstance;
}

function startSession() {
  if (!mongoClientInstance) {
    throw new Error("MongoClient not initialized!");
  }
  return mongoClientInstance.startSession();
}

module.exports = { getDb, connectDb, startSession };
