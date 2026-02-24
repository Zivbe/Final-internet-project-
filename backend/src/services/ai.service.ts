import { createHash } from "crypto";
import { env } from "../config/env.js";

export type AiInsights = {
  summary: string;
  suggestedCaptions: string[];
  moderationFlags: string[];
  suggestedTags: string[];
};

export type AiQueryResult = {
  answer: string;
  usedPosts: number;
};

type CacheEntry<T> = {
  payload: T;
  expiresAt: number;
};

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

const CACHE_TTL_MS = 60 * 1000;
const AI_TIMEOUT_MS = 12_000;
const RATE_WINDOW_MS = 60 * 1000;
const configuredLimit = Number.isFinite(env.aiRequestsPerMinute) ? env.aiRequestsPerMinute : 6;
const MAX_REQUESTS_PER_WINDOW = Math.max(1, Math.floor(configuredLimit));

const cache = new Map<string, CacheEntry<unknown>>();
const rateWindow = new Map<string, { count: number; resetAt: number }>();

export class AiServiceError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status = 500, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const ensureConfigured = () => {
  if (!env.geminiApiKey) {
    throw new AiServiceError("AI is not configured (missing GEMINI_API_KEY).", 501);
  }
};

const enforceRateLimit = (userId: string) => {
  const now = Date.now();
  const bucket = rateWindow.get(userId);
  if (!bucket || bucket.resetAt <= now) {
    rateWindow.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return;
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    throw new AiServiceError(
      "Too many AI requests. Please wait a moment before trying again.",
      429
    );
  }

  bucket.count += 1;
};

const toCacheKey = (userId: string, scope: string, items: string[]) => {
  const digest = createHash("sha256").update(items.join("|")).digest("hex");
  return `${userId}:${scope}:${digest}`;
};

const getCached = <T>(key: string): T | undefined => {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.payload as T;
};

const setCache = <T>(key: string, payload: T) => {
  cache.set(key, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
};

const extractText = (data: GeminiResponse): string =>
  data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

const parseProviderError = (body: string): { message?: string; raw: string } => {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    return {
      message: parsed.error?.message,
      raw: body.slice(0, 500)
    };
  } catch {
    return { raw: body.slice(0, 500) };
  }
};

const friendlyMessageForStatus = (status: number) => {
  if (status === 429) {
    return "AI provider rate limit reached";
  }
  if (status === 503) {
    return "AI provider temporarily unavailable";
  }
  return "AI provider error";
};

const callGemini = async (prompt: string, temperature: number) => {
  ensureConfigured();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      env.geminiModel
    )}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json"
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text();
      const providerError = parseProviderError(body);
      throw new AiServiceError(
        friendlyMessageForStatus(response.status),
        response.status,
        providerError.message ?? providerError.raw
      );
    }

    return (await response.json()) as GeminiResponse;
  } catch (error) {
    if (error instanceof AiServiceError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiServiceError("AI provider timeout", 504);
    }
    throw new AiServiceError(
      "Failed to communicate with AI provider",
      502,
      error instanceof Error ? error.message : undefined
    );
  } finally {
    clearTimeout(timeout);
  }
};

const parseAiInsights = (text: string): AiInsights => {
  try {
    const data = JSON.parse(text) as Partial<AiInsights>;
    return {
      summary: data.summary ?? "No summary available.",
      suggestedCaptions: Array.isArray(data.suggestedCaptions)
        ? data.suggestedCaptions.slice(0, 3)
        : [],
      moderationFlags: Array.isArray(data.moderationFlags)
        ? data.moderationFlags.slice(0, 5)
        : [],
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

const parseAiQueryResponse = (text: string, fallbackUsedPosts: number): AiQueryResult => {
  try {
    const data = JSON.parse(text) as Partial<AiQueryResult>;
    return {
      answer: data.answer ?? text.slice(0, 800),
      usedPosts:
        typeof data.usedPosts === "number" && data.usedPosts >= 0
          ? data.usedPosts
          : fallbackUsedPosts
    };
  } catch {
    return {
      answer: text.slice(0, 800),
      usedPosts: fallbackUsedPosts
    };
  }
};

const buildInsightsPrompt = (contentItems: string[]) => `
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

const buildQuestionPrompt = (question: string, contentItems: string[]) => `
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

export const aiService = {
  async getFeedInsights(
    userId: string,
    scope: "all" | "mine",
    contentItems: string[]
  ): Promise<AiInsights> {
    enforceRateLimit(userId);
    const cacheKey = toCacheKey(userId, `insights:${scope}`, contentItems);
    const cached = getCached<AiInsights>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await callGemini(buildInsightsPrompt(contentItems), 0.3);
    const parsed = parseAiInsights(extractText(response));
    setCache(cacheKey, parsed);
    return parsed;
  },

  async askFeedQuestion(
    userId: string,
    scope: "all" | "mine",
    question: string,
    contentItems: string[]
  ): Promise<AiQueryResult> {
    enforceRateLimit(userId);
    const cacheKey = toCacheKey(userId, `query:${scope}:${question}`, contentItems);
    const cached = getCached<AiQueryResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await callGemini(buildQuestionPrompt(question, contentItems), 0.2);
    const parsed = parseAiQueryResponse(extractText(response), contentItems.length);
    setCache(cacheKey, parsed);
    return parsed;
  }
};
