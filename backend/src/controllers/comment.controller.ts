import type { Response } from "express";
import { Comment } from "../models/Comment.js";
import { Image } from "../models/Image.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const getCommentsByImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ imageId })
      .populate("userId", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ imageId });

    res.json({
      comments: comments.map((comment: any) => ({
        id: comment._id.toString(),
        imageId: comment.imageId.toString(),
        text: comment.text,
        user: {
          id: comment.userId?._id?.toString?.() ?? "",
          username: comment.userId?.username ?? "unknown"
        },
        createdAt: comment.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments", error });
  }
};

export const createComment = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { imageId } = req.params;
  const text = (req.body?.text as string | undefined)?.trim();
  if (!text) {
    return res.status(400).json({ message: "Comment text is required" });
  }

  const image = await Image.findById(imageId);
  if (!image) {
    return res.status(404).json({ message: "Image not found" });
  }

  try {
    const comment = await Comment.create({
      imageId,
      userId: req.user.id,
      text
    });

    await Image.findByIdAndUpdate(imageId, { $inc: { commentCount: 1 } });
    await comment.populate("userId", "username");

    res.status(201).json({
      message: "Comment added",
      comment: {
        id: comment._id.toString(),
        imageId: comment.imageId.toString(),
        text: comment.text,
        user: {
          id: (comment as any).userId?._id?.toString?.() ?? req.user.id,
          username: (comment as any).userId?.username ?? req.user.username
        },
        createdAt: comment.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment", error });
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { commentId } = req.params;
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    const imageId = comment.imageId.toString();
    await comment.deleteOne();
    await Image.findByIdAndUpdate(imageId, { $inc: { commentCount: -1 } });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete comment", error });
  }
};
