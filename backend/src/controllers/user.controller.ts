import type { Response } from "express";
import { unlink } from "fs/promises";
import { User } from "../models/User.js";
import { Image } from "../models/Image.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { formatImageResponse } from "./image.controller.js";

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await User.findById(req.user.id).select("username photoUrl createdAt");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    id: user._id.toString(),
    username: user.username,
    photoUrl: user.photoUrl || "",
    createdAt: user.createdAt
  });
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;

  const user = await User.findById(userId).select("username photoUrl createdAt");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const query = { uploadedBy: userId };
  const images = await Image.find(query)
    .populate("uploadedBy", "username")
    .populate("likes", "username")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Image.countDocuments(query);

  return res.json({
    user: {
      id: user._id.toString(),
      username: user.username,
      photoUrl: user.photoUrl || "",
      createdAt: user.createdAt
    },
    images: images.map(formatImageResponse),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    canEdit: req.user?.id === userId
  });
};

export const updateMyPhoto = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!req.file) {
    return res.status(400).json({ message: "Photo file is required" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const oldPath = user.photoPath;
  user.photoPath = req.file.path;
  user.photoUrl = `/uploads/profiles/${req.file.filename}`;
  await user.save();

  if (oldPath && oldPath !== user.photoPath) {
    unlink(oldPath).catch(() => {});
  }

  return res.json({
    message: "Profile photo updated",
    user: {
      id: user._id.toString(),
      username: user.username,
      photoUrl: user.photoUrl || "",
      createdAt: user.createdAt
    }
  });
};
