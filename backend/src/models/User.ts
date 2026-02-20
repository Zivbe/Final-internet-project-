import mongoose, { Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    photoUrl: { type: String, default: "" },
    photoPath: { type: String, default: "" },
    refreshTokenHashes: { type: [String], default: [] }
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User = mongoose.model("User", userSchema);
