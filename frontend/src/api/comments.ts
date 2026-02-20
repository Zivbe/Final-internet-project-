import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/api/comments`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
  "Content-Type": "application/json"
});

export type CommentItem = {
  id: string;
  imageId: string;
  text: string;
  user: {
    id: string;
    username: string;
  };
  createdAt: string;
};

export const getCommentsByImage = async (
  imageId: string,
  page = 1,
  limit = 20
): Promise<{
  comments: CommentItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  const res = await fetch(`${API_URL}/image/${imageId}?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch comments" }));
    throw new Error(error.message || "Failed to fetch comments");
  }

  return res.json();
};

export const createComment = async (
  imageId: string,
  text: string
): Promise<{ message: string; comment: CommentItem }> => {
  const res = await fetch(`${API_URL}/image/${imageId}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to add comment" }));
    throw new Error(error.message || "Failed to add comment");
  }

  return res.json();
};

export const deleteComment = async (commentId: string): Promise<void> => {
  const res = await fetch(`${API_URL}/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to delete comment" }));
    throw new Error(error.message || "Failed to delete comment");
  }
};
