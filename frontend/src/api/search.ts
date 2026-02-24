import type { Image } from "./images";
import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/api/search`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
});

export type User = {
  id: string;
  username: string;
  createdAt: string;
};

export const searchImages = async (
  query: string,
  tags?: string[],
  uploadedBy?: string,
  page = 1
): Promise<{
  images: Image[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  query: {
    q?: string;
    tags?: string | string[];
    uploadedBy?: string;
  };
}> => {
  const params = new URLSearchParams({
    q: query,
    page: page.toString()
  });

  if (tags && tags.length > 0) {
    tags.forEach((tag) => params.append("tags", tag));
  }
  if (uploadedBy) {
    params.append("uploadedBy", uploadedBy);
  }

  const res = await fetch(`${API_URL}/images?${params}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Search failed" }));
    throw new Error(error.message || "Search failed");
  }

  return res.json();
};

export const searchUsers = async (
  query: string,
  page = 1
): Promise<{
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const params = new URLSearchParams({
    q: query,
    page: page.toString()
  });

  const res = await fetch(`${API_URL}/users?${params}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "User search failed" }));
    throw new Error(error.message || "User search failed");
  }

  return res.json();
};
