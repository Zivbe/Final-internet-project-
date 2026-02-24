import type { Response } from "express";
import { Image } from "../models/Image.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { UserDocument } from "../models/User.js";

export const toggleLike = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { imageId } = req.params;
    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const userId = req.user.id;
    const likes = (image.likes || []).map(id => id.toString());
    const hasLiked = likes.includes(userId);

    if (hasLiked) {
      image.likes = image.likes?.filter(id => id.toString() !== userId) || [];
      image.likeCount = Math.max(0, (image.likeCount || 0) - 1);
    } else {
      if (!image.likes) image.likes = [];
      image.likes.push(userId as unknown as typeof image.likes[0]);
      image.likeCount = (image.likeCount || 0) + 1;
    }

    await image.save();
    await image.populate("likes", "username");

    const populatedLikes = (image.likes || []).filter(like => typeof like === "object") as unknown as UserDocument[];

    res.json({
      liked: !hasLiked,
      likeCount: image.likeCount,
      likes: populatedLikes.map(user => ({
        id: user._id.toString(),
        username: user.username
      })),
      message: !hasLiked ? "Image liked" : "Image unliked"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle like", error });
  }
};

export const getLikedBy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    const image = await Image.findById(imageId).populate("likes", "username");

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const populatedLikes = (image.likes || []).filter(like => typeof like === "object") as unknown as UserDocument[];

    res.json({
      likedBy: populatedLikes.map(user => ({
        id: user._id.toString(),
        username: user.username
      })),
      likeCount: image.likeCount || 0
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch likes", error });
  }
};
