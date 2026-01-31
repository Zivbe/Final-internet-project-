import type { AuthResponse } from "../types/auth";

const API_URL = "http://localhost:4000/api/auth";

const request = async (path: string, body?: object): Promise<AuthResponse> => {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
};

export const register = (username: string, password: string) =>
  request("/register", { username, password });

export const login = (username: string, password: string) =>
  request("/login", { username, password });

export const refresh = () => request("/refresh");

export const logout = async () => {
  await fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "include"
  });
};
