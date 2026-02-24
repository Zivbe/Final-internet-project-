import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/api/ai`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
});

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

export const getFeedInsights = async (scope: "all" | "mine"): Promise<AiInsights> => {
  const res = await fetch(`${API_URL}/insights?scope=${scope}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const detail = error.details ? `: ${error.details}` : "";
    throw new Error(error.message ? `${error.message}${detail}` : "Failed to fetch AI insights");
  }

  return res.json();
};

export const askFeedQuestion = async (
  question: string,
  scope: "all" | "mine"
): Promise<AiQueryResult> => {
  const res = await fetch(`${API_URL}/query`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ question, scope })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const detail = error.details ? `: ${error.details}` : "";
    throw new Error(error.message ? `${error.message}${detail}` : "Failed to query AI");
  }

  return res.json();
};
