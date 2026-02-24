import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AuthResponse, User } from "../types/auth";
import * as authApi from "../api/auth";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  initializing: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (data: AuthResponse) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const hasSessionRef = useRef(false);

  const setSession = (data: AuthResponse) => {
    hasSessionRef.current = true;
    setUser(data.user);
    setAccessToken(data.accessToken);
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }
    localStorage.setItem("user", JSON.stringify(data.user));
    setInitializing(false);
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
    hasSessionRef.current = false;
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setInitializing(false);
  };

  useEffect(() => {
    let cancelled = false;

    // Restore from localStorage first for fast startup
    const storedToken = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        hasSessionRef.current = true;
        setUser(JSON.parse(storedUser) as User);
      } catch {
        localStorage.removeItem("user");
      }
    }

    if (storedToken) {
      setAccessToken(storedToken);
      authApi
        .refresh()
        .then(setSession)
        .catch(() => {
          if (hasSessionRef.current || cancelled) {
            return;
          }
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        })
        .finally(() => {
          if (!cancelled) {
            setInitializing(false);
          }
        });
    } else {
      authApi
        .refresh()
        .then(setSession)
        .catch(() => {
          if (hasSessionRef.current || cancelled) {
            return;
          }
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        })
        .finally(() => {
          if (!cancelled) {
            setInitializing(false);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, initializing, login, register, logout, setSession }),
    [user, accessToken, initializing]
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
