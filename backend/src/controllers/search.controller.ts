import type { Response } from "express";
import { Image } from "../models/Image.js";
import { User } from "../models/User.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { formatImageResponse } from "./image.controller.js";

export const searchImages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, tags, uploadedBy, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    if (q) {
      query.$or = [
        { description: { $regex: q as string, $options: "i" } },
        { originalName: { $regex: q as string, $options: "i" } }
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    if (uploadedBy) {
      query.uploadedBy = uploadedBy;
    }

    const images = await Image.find(query)
      .populate("uploadedBy", "username")
      .populate("likes", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Image.countDocuments(query);

    res.json({
      images: images.map(formatImageResponse),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      query: { q, tags, uploadedBy }
    });
  } catch (error) {
    res.status(500).json({ message: "Search failed", error });
  }
};

export const searchUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};
    if (q) {
      query.username = { $regex: q as string, $options: "i" };
    }

    const users = await User.find(query)
      .select("username createdAt")
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.json({
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        createdAt: user.createdAt
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "User search failed", error });
  }
};
