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

type AiQueryResult = {
  answer: string;
  usedPosts: number;
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

const parseAiQueryResponse = (text: string): AiQueryResult => {
  try {
    const data = JSON.parse(text) as Partial<AiQueryResult>;
    return {
      answer: data.answer ?? text.slice(0, 800),
      usedPosts: Number.isFinite(data.usedPosts) ? Number(data.usedPosts) : 0
    };
  } catch {
    return {
      answer: text.slice(0, 800),
      usedPosts: 0
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

export const askFeedQuestion = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!env.geminiApiKey) {
    return res.status(501).json({ message: "AI is not configured (missing GEMINI_API_KEY)." });
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

  const key = toCacheKey(req.user.id, `q:${scope}:${question}`, contentItems);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return res.json({
      answer: hit.payload.summary,
      usedPosts: contentItems.length
    });
  }

  const prompt = `
You are answering a user question about posts from an image sharing app.
Use only the given posts. If information is missing, say so clearly.
Return strict JSON:
{
  "answer": "string",
  "usedPosts": number
}

Question: ${question}

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
        temperature: 0.2,
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
  const parsed = parseAiQueryResponse(text);
  cache.set(key, {
    payload: {
      summary: parsed.answer,
      suggestedCaptions: [],
      moderationFlags: [],
      suggestedTags: []
    },
    expiresAt: Date.now() + CACHE_TTL_MS
  });
  return res.json({
    answer: parsed.answer,
    usedPosts: parsed.usedPosts || contentItems.length
  });
};
