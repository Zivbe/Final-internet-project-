import mongoose from "mongoose";
import { env } from "./env.js";

import dotenv from "dotenv";
dotenv.config();

export const connectDb = async (): Promise<void> => {
  try {
    const mongoUri = env.mongoUri.trim();
    if (!mongoUri.startsWith("mongodb://")) {
      throw new Error("MONGO_URI must start with mongodb:// for local MongoDB.");
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};
