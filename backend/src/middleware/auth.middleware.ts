import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export type AuthenticatedRequest = Request;

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing access token" });
    return;
  }

  const token = header.replace("Bearer ", "");
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const getUserId = (req: AuthenticatedRequest): string => {
  const user = req.user as { id: string; username: string } | undefined;
  if (!user?.id) {
    throw new Error("Unauthorized");
  }
  return user.id;
};
