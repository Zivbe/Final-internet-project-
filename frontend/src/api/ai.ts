type AiSummaryResponse = {
  summary: string;
  tags: string[];
  category: string;
};

const API_URL = "http://localhost:4000/api/ai";

export const summarizeText = async (
  token: string,
  text: string
): Promise<AiSummaryResponse> => {
  const res = await fetch(`${API_URL}/summarize`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "AI failed" }));
    throw new Error(error.message || "AI failed");
  }
  return res.json();
};
