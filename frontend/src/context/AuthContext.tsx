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
  };

  useEffect(() => {
    authApi
      .refresh()
      .then(setSession)
      .catch(() => {
        setUser(null);
        setAccessToken(null);
      });
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
