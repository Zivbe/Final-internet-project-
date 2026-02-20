import mongoose, { Schema, type InferSchemaType } from "mongoose";

const imageSchema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String },
    tags: { type: [String], default: [] },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Add indexes for better search performance
imageSchema.index({ description: "text", originalName: "text" });
imageSchema.index({ tags: 1 });
imageSchema.index({ uploadedBy: 1 });
imageSchema.index({ createdAt: -1 });

export type ImageDocument = InferSchemaType<typeof imageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Image = mongoose.model("Image", imageSchema);
