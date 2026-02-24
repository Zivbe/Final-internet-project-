import { API_BASE_URL } from "../config";
import type { Image } from "./images";
import type { User } from "../types/auth";

const API_URL = `${API_BASE_URL}/api/users`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
});

export const getMyProfile = async (): Promise<User & { createdAt: string }> => {
  const res = await fetch(`${API_URL}/me`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    throw new Error("Failed to fetch user details");
  }
  return res.json();
};

export const updateMyProfile = async (
  data: { username: string }
): Promise<{ message: string; user: User & { createdAt: string } }> => {
  const res = await fetch(`${API_URL}/me`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to update profile" }));
    throw new Error(error.message || "Failed to update profile");
  }
  return res.json();
};

export const getUserProfile = async (
  userId: string,
  page = 1,
  limit = 12
): Promise<{
  user: User & { createdAt: string };
  images: Image[];
  pagination: { page: number; limit: number; total: number; pages: number };
  canEdit: boolean;
}> => {
  const res = await fetch(`${API_URL}/${userId}?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }
  return res.json();
};

export const updateMyPhoto = async (
  file: File
): Promise<{ message: string; user: User & { createdAt: string } }> => {
  const formData = new FormData();
  formData.append("photo", file);
  const res = await fetch(`${API_URL}/me/photo`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: formData
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to update photo" }));
    throw new Error(error.message || "Failed to update photo");
  }
  return res.json();
};
