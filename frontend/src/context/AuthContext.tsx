import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthResponse, User } from "../types/auth";
import * as authApi from "../api/auth";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (data: AuthResponse) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const setSession = (data: AuthResponse) => {
    setUser(data.user);
    setAccessToken(data.accessToken);
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }
  };

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    setSession(data);
  };

  const register = async (username: string, password: string) => {
    const data = await authApi.register(username, password);
    setSession(data);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
  };

  useEffect(() => {
    // Try to get token from localStorage first
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      // Decode token to get user info (basic approach)
      try {
        const payloadSegment = storedToken.split(".")[1] || "";
        const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        setUser({ id: payload.sub, username: payload.username, photoUrl: payload.photoUrl ?? "" });
        setAccessToken(storedToken);
        authApi.refresh().then(setSession).catch(() => {});
      } catch {
        // If token is invalid, try refresh
        authApi
          .refresh()
          .then(setSession)
          .catch(() => {
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem("accessToken");
          });
      }
    } else {
      // No stored token, try refresh
      authApi
        .refresh()
        .then(setSession)
        .catch(() => {
          setUser(null);
          setAccessToken(null);
        });
    }
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, login, register, logout, setSession }),
    [user, accessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
