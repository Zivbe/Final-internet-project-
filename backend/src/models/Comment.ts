import mongoose, { Schema, type InferSchemaType } from "mongoose";

const commentSchema = new Schema(
  {
    imageId: { type: Schema.Types.ObjectId, ref: "Image", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

commentSchema.index({ imageId: 1, createdAt: -1 });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Comment = mongoose.model("Comment", commentSchema);
