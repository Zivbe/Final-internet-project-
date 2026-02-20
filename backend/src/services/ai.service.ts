import OpenAI from "openai";
import { env } from "../config/env.js";
import { AiUsage } from "../models/AiUsage.js";

const MAX_INPUT_CHARS = 4000;

const getOpenAIClient = () => {
  // Read directly from process.env to allow runtime changes for testing
  const apiKey = (process.env.OPENAI_API_KEY ?? env.openaiApiKey)?.trim();
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

export type AiSummaryResult = {
  summary: string;
  tags: string[];
  category: string;
};

export const summarizeText = async (
  userId: string,
  text: string
): Promise<AiSummaryResult> => {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Text is required");
  }
  if (trimmed.length > MAX_INPUT_CHARS) {
    throw new Error("Text too long");
  }

  const completion = await openai.chat.completions.create({
    model: env.openaiModel,
    messages: [
      {
        role: "system",
        content:
          "You summarize short posts and return JSON with keys summary, tags, category."
      },
      {
        role: "user",
        content: trimmed
      }
    ],
    response_format: { type: "json_object" }
  });

  const message = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(message) as AiSummaryResult;

  await AiUsage.create({
    user: userId,
    endpoint: "summarize",
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
    model: env.openaiModel
  });

  return {
    summary: parsed.summary ?? "",
    tags: parsed.tags ?? [],
    category: parsed.category ?? ""
  };
};
