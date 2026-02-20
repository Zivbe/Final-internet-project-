import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getUserId } from "../middleware/auth.middleware.js";
import { buildFileUrl } from "../utils/url.js";
import { createComment, deleteComment, listComments } from "../services/comment.service.js";
import type { UserDocument } from "../models/User.js";
import mongoose from "mongoose";

const parseCursor = (cursor?: string) => {
  if (!cursor) return undefined;
  const [createdAtRaw, id] = cursor.split("|");
  if (!createdAtRaw || !id) return undefined;
  const createdAt = new Date(createdAtRaw);
  if (Number.isNaN(createdAt.getTime())) return undefined;
  return { createdAt, id };
};

export const list = async (req: Request, res: Response) => {
  const requested = Number(req.query.limit ?? 20);
  const limit = Number.isFinite(requested) ? Math.min(requested, 100) : 20;
  const cursor = parseCursor(req.query.cursor as string | undefined);
  const postId = req.params.postId;

  const serializeAuthor = (author: UserDocument | mongoose.Types.ObjectId) => {
    if (author instanceof mongoose.Types.ObjectId) {
      return { id: author.toString(), username: "", avatarUrl: "" };
    }
    return {
      id: author._id.toString(),
      username: author.username,
      avatarUrl: buildFileUrl(req, author.avatarPath)
    };
  };

  const comments = await listComments(postId, limit, cursor);
  const items = comments.map((comment) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    author: serializeAuthor(comment.author as unknown as UserDocument | mongoose.Types.ObjectId)
  }));
  const last = comments[comments.length - 1];
  const nextCursor =
    last ? `${last.createdAt.toISOString()}|${last.id}` : null;

  res.json({ items, nextCursor });
};

export const create = async (req: AuthenticatedRequest, res: Response) => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    return res.status(400).json({ message: "Text is required" });
  }
  try {
    const userId = getUserId(req);
    const comment = await createComment(req.params.postId, userId, text.trim());
    await comment.populate("author", "username avatarPath");
    const serializeAuthor = (author: UserDocument | mongoose.Types.ObjectId) => {
      if (author instanceof mongoose.Types.ObjectId) {
        return { id: author.toString(), username: "", avatarUrl: "" };
      }
      return {
        id: author._id.toString(),
        username: author.username,
        avatarUrl: buildFileUrl(req, author.avatarPath)
      };
    };
    res.status(201).json({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      author: serializeAuthor(comment.author as unknown as UserDocument | mongoose.Types.ObjectId)
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    await deleteComment(req.params.commentId, userId);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};
