import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/api/likes`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
});

export type LikeResponse = {
  liked: boolean;
  likeCount: number;
  likes: Array<{ id: string; username: string }>;
  message: string;
};

export const toggleLike = async (imageId: string): Promise<LikeResponse> => {
  const res = await fetch(`${API_URL}/${imageId}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to toggle like" }));
    throw new Error(error.message || "Failed to toggle like");
  }

  return res.json();
};

export const getLikedBy = async (imageId: string): Promise<{
  likedBy: Array<{ id: string; username: string }>;
  likeCount: number;
}> => {
  const res = await fetch(`${API_URL}/${imageId}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error("Failed to fetch likes");
  }

  return res.json();
};
