import type { PostListResponse, Post } from "../types/post";

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

export const listPosts = async (
  token: string,
  cursor?: string | null
): Promise<PostListResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const res = await authFetch(`?${params.toString()}`, token);
  if (!res.ok) {
    throw new Error("Failed to load feed");
  }
  return res.json();
};

export const searchPosts = async (
  token: string,
  query: string
): Promise<{ items: Post[] }> => {
  const params = new URLSearchParams();
  params.set("q", query);
  const res = await authFetch(`/search?${params.toString()}`, token);
  if (!res.ok) {
    throw new Error("Search failed");
  }
  return res.json();
};

export const createPost = async (
  token: string,
  text: string,
  image?: File | null
): Promise<Post> => {
  const formData = new FormData();
  if (text.trim()) {
    formData.append("text", text);
  }
  if (image) {
    formData.append("image", image);
  }
  const res = await authFetch("", token, { method: "POST", body: formData });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Create failed" }));
    throw new Error(error.message || "Create failed");
  }
  return res.json();
};

export const updatePost = async (
  token: string,
  postId: string,
  text: string
): Promise<Post> => {
  const res = await authFetch(`/${postId}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Update failed" }));
    throw new Error(error.message || "Update failed");
  }
  return res.json();
};

export const deletePost = async (token: string, postId: string) => {
  const res = await authFetch(`/${postId}`, token, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("Delete failed");
  }
};

export const likePost = async (token: string, postId: string) => {
  const res = await authFetch(`/${postId}/likes`, token, { method: "POST" });
  if (!res.ok) {
    throw new Error("Like failed");
  }
};

export const unlikePost = async (token: string, postId: string) => {
  const res = await authFetch(`/${postId}/likes`, token, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("Unlike failed");
  }
};
