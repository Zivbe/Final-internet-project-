import type { CommentListResponse, Comment } from "../types/comment";

const API_URL = "http://localhost:4000/api/posts";

const authFetch = async (
  path: string,
  token: string,
  options?: RequestInit
): Promise<Response> => {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options?.headers ?? {}),
      Authorization: `Bearer ${token}`
    },
    credentials: "include"
  });
};

export const listComments = async (
  token: string,
  postId: string,
  cursor?: string | null
): Promise<CommentListResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const res = await authFetch(`/${postId}/comments?${params.toString()}`, token);
  if (!res.ok) {
    throw new Error("Failed to load comments");
  }
  return res.json();
};

export const createComment = async (
  token: string,
  postId: string,
  text: string
): Promise<Comment> => {
  const res = await authFetch(`/${postId}/comments`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Create failed" }));
    throw new Error(error.message || "Create failed");
  }
  return res.json();
};

export const deleteComment = async (
  token: string,
  postId: string,
  commentId: string
) => {
  const res = await authFetch(`/${postId}/comments/${commentId}`, token, {
    method: "DELETE"
  });
  if (!res.ok) {
    throw new Error("Delete failed");
  }
};
