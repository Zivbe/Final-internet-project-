import mongoose, { Schema, type InferSchemaType } from "mongoose";

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true },
    imagePath: { type: String },
    commentCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

postSchema.index({ text: "text" });

export type PostDocument = InferSchemaType<typeof postSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Post = mongoose.model("Post", postSchema);
