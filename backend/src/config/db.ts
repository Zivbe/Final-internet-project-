import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDb = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};
