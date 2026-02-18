import type { User } from "../types/auth";

const API_URL = "http://localhost:4000/api/users";

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

export const getMe = async (token: string): Promise<User> => {
  const res = await authFetch("/me", token);
  if (!res.ok) {
    throw new Error("Failed to load profile");
  }
  return res.json();
};

export const updateProfile = async (
  token: string,
  username: string
): Promise<User> => {
  const res = await authFetch("/me", token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Update failed" }));
    throw new Error(error.message || "Update failed");
  }
  return res.json();
};

export const uploadAvatar = async (
  token: string,
  file: File
): Promise<User> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await authFetch("/me/avatar", token, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || "Upload failed");
  }
  return res.json();
};
