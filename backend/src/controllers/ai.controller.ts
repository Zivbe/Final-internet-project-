import type { Response } from "express";
import { Image } from "../models/Image.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  AiServiceError,
  aiService,
  type AiInsights,
  type AiQueryResult
} from "../services/ai.service.js";

const handleAiError = (error: unknown, res: Response) => {
  if (error instanceof AiServiceError) {
    return res.status(error.status).json(
      error.details
        ? { message: error.message, details: error.details }
        : { message: error.message }
    );
  }

  console.error("AI integration error:", error);
  return res.status(500).json({ message: "Unexpected AI error" });
};

export const getFeedInsights = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const scope = req.query.scope === "mine" ? "mine" : "all";
  const query = scope === "mine" ? { uploadedBy: req.user.id } : {};

  const images = await Image.find(query).sort({ createdAt: -1 }).limit(30).lean();
  const contentItems = images
    .map((img) => `${img.originalName || ""}. ${img.description || ""}`.trim())
    .filter(Boolean);

  if (contentItems.length === 0) {
    return res.json({
      summary: "No content available yet for AI analysis.",
      suggestedCaptions: [],
      moderationFlags: [],
      suggestedTags: []
    });
  }

  try {
    const insights: AiInsights = await aiService.getFeedInsights(
      req.user.id,
      scope,
      contentItems
    );
    return res.json(insights);
  } catch (error) {
    return handleAiError(error, res);
  }
};

export const askFeedQuestion = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const question = (req.body?.question as string | undefined)?.trim();
  const scope = req.body?.scope === "mine" ? "mine" : "all";
  if (!question) {
    return res.status(400).json({ message: "question is required" });
  }

  const query = scope === "mine" ? { uploadedBy: req.user.id } : {};
  const images = await Image.find(query).sort({ createdAt: -1 }).limit(40).lean();
  const contentItems = images
    .map((img) => `${img.originalName || ""}. ${img.description || ""}`.trim())
    .filter(Boolean);

  if (contentItems.length === 0) {
    return res.json({ answer: "No content available to analyze yet.", usedPosts: 0 });
  }

  try {
    const result: AiQueryResult = await aiService.askFeedQuestion(
      req.user.id,
      scope,
      question,
      contentItems
    );
    return res.json(result);
  } catch (error) {
    return handleAiError(error, res);
  }
};
