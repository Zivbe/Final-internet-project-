import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  process.env.JWT_ACCESS_SECRET = "test_access_secret";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
  process.env.SESSION_SECRET = "test_session_secret";
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) {
    return;
  }
  const collections = await db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
