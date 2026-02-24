import { API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/api/images`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
});

export type Image = {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  uploadedBy: {
    id: string;
    username: string;
  };
  description?: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  likes: Array<{ id: string; username: string }>;
  createdAt: string;
};

export const uploadImage = async (
  file?: File | null,
  description?: string,
  tags?: string[]
): Promise<{ message: string; image: Image }> => {
  const formData = new FormData();
  if (file) {
    formData.append("image", file);
  }
  if (description) formData.append("description", description);
  if (tags) formData.append("tags", JSON.stringify(tags));

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || "Upload failed");
  }

  return res.json();
};

export const getImages = async (
  page = 1,
  limit = 20
): Promise<{
  images: Image[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const res = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error("Failed to fetch images");
  }

  return res.json();
};

export const getMyImages = async (
  page = 1,
  limit = 20
): Promise<{
  images: Image[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const res = await fetch(`${API_URL}/mine?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error("Failed to fetch your images");
  }

  return res.json();
};

export const getImageById = async (id: string): Promise<Image> => {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error("Failed to fetch image");
  }

  return res.json();
};

export const updateImage = async (
  id: string,
  data: { description?: string; file?: File | null }
): Promise<{ message: string; image: Image }> => {
  const formData = new FormData();
  if (typeof data.description === "string") {
    formData.append("description", data.description);
  }
  if (data.file) {
    formData.append("image", data.file);
  }

  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: formData
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to update image" }));
    throw new Error(error.message || "Failed to update image");
  }

  return res.json();
};

export const deleteImage = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to delete image" }));
    throw new Error(error.message || "Failed to delete image");
  }
};
