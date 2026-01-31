import type { Request, Response } from "express";
import {
  loginUser,
  registerUser,
  revokeRefreshToken,
  rotateRefreshToken
} from "../services/auth.service.js";
import { verifyRefreshToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.nodeEnv === "production",
  maxAge: 1000 * 60 * 60 * 24 * 7
};

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    const result = await registerUser(username, password);
    res
      .cookie("refreshToken", result.refreshToken, refreshCookieOptions)
      .status(201)
      .json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    const result = await loginUser(username, password);
    res
      .cookie("refreshToken", result.refreshToken, refreshCookieOptions)
      .json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    res.status(401).json({ message: (error as Error).message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  try {
    const payload = verifyRefreshToken(token);
    const result = await rotateRefreshToken(payload.sub, payload.username, token);
    res
      .cookie("refreshToken", result.refreshToken, refreshCookieOptions)
      .json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    res.status(401).json({ message: (error as Error).message });
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await revokeRefreshToken(payload.sub, token);
    } catch {
      // ignore token errors on logout
    }
  }

  res.clearCookie("refreshToken", refreshCookieOptions).status(204).send();
};
