import type { Response } from "express";
import { createHash } from "crypto";
import { Image } from "../models/Image.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { env } from "../config/env.js";

type AiInsights = {
  summary: string;
  suggestedCaptions: string[];
  moderationFlags: string[];
  suggestedTags: string[];
};

type CacheEntry = {
  expiresAt: number;
  payload: AiInsights;
};

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

const toCacheKey = (userId: string, scope: string, items: string[]) => {
  const digest = createHash("sha256").update(items.join("|")).digest("hex");
  return `${userId}:${scope}:${digest}`;
};

const parseAiResponse = (text: string): AiInsights => {
  try {
    const data = JSON.parse(text) as Partial<AiInsights>;
    return {
      summary: data.summary ?? "No summary available.",
      suggestedCaptions: Array.isArray(data.suggestedCaptions) ? data.suggestedCaptions.slice(0, 3) : [],
      moderationFlags: Array.isArray(data.moderationFlags) ? data.moderationFlags.slice(0, 5) : [],
      suggestedTags: Array.isArray(data.suggestedTags) ? data.suggestedTags.slice(0, 8) : []
    };
  } catch {
    return {
      summary: text.slice(0, 600),
      suggestedCaptions: [],
      moderationFlags: [],
      suggestedTags: []
    };
  }
};

export const getFeedInsights = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!env.geminiApiKey) {
    return res.status(501).json({ message: "AI is not configured (missing GEMINI_API_KEY)." });
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

  const key = toCacheKey(req.user.id, scope, contentItems);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return res.json(hit.payload);
  }

  const prompt = `
You are analyzing posts in an image sharing application.
Given these post texts, return strictly valid JSON with keys:
- summary: string
- suggestedCaptions: string[] (max 3)
- moderationFlags: string[] (max 5, empty if none)
- suggestedTags: string[] (max 8)

Focus on practical insights for the app feed.
Posts:
${contentItems.map((t, i) => `${i + 1}. ${t}`).join("\n")}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    return res.status(502).json({ message: "AI provider error", details: body.slice(0, 500) });
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = parseAiResponse(text);
  cache.set(key, { payload: parsed, expiresAt: Date.now() + CACHE_TTL_MS });
  return res.json(parsed);
};
