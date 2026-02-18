import mongoose, { Schema, type InferSchemaType } from "mongoose";

const aiUsageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    model: { type: String, required: true }
  },
  { timestamps: true }
);

aiUsageSchema.index({ user: 1, createdAt: -1 });

export type AiUsageDocument = InferSchemaType<typeof aiUsageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AiUsage = mongoose.model("AiUsage", aiUsageSchema);
