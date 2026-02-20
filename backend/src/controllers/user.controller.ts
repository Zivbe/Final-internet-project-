import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getUserById, updateAvatar, updateUsername } from "../services/user.service.js";
import { buildFileUrl } from "../utils/url.js";

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req.user as { id: string; username: string })?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await getUserById(userId);
    res.json({
      id: user.id,
      username: user.username,
      avatarUrl: buildFileUrl(req, user.avatarPath)
    });
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

export const patchMe = async (req: AuthenticatedRequest, res: Response) => {
  const { username } = req.body as { username?: string };
  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }
  try {
    const userId = (req.user as { id: string; username: string })?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await updateUsername(userId, username);
    res.json({
      id: user.id,
      username: user.username,
      avatarUrl: buildFileUrl(req, user.avatarPath)
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image is required" });
  }
  const avatarPath = `/uploads/${req.file.filename}`;
  try {
    const userId = (req.user as { id: string; username: string })?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await updateAvatar(userId, avatarPath);
    res.json({
      id: user.id,
      username: user.username,
      avatarUrl: buildFileUrl(req, user.avatarPath)
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
