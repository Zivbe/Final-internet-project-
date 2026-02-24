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

export const getFeedInsights = async (scope: "all" | "mine"): Promise<AiInsights> => {
  const res = await fetch(`${API_URL}/insights?scope=${scope}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch AI insights" }));
    throw new Error(error.message || "Failed to fetch AI insights");
  }

  return res.json();
};
