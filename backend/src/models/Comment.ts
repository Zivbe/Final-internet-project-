import mongoose, { Schema, type InferSchemaType } from "mongoose";

const commentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1, _id: -1 });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Comment = mongoose.model("Comment", commentSchema);
