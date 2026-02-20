import type { Response, Request } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getUserId } from "../middleware/auth.middleware.js";
import { buildFileUrl } from "../utils/url.js";
import {
  createPost,
  deletePost,
  listPosts,
  updatePost,
  searchPosts
} from "../services/post.service.js";
import { verifyAccessToken } from "../utils/jwt.js";
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

const serializeAuthor = (req: Request, author: UserDocument | mongoose.Types.ObjectId) => {
  if (author instanceof mongoose.Types.ObjectId) {
    return { id: author.toString(), username: "", avatarUrl: "" };
  }
  return {
    id: author._id.toString(),
    username: author.username,
    avatarUrl: buildFileUrl(req, author.avatarPath)
  };
};

export const create = async (req: AuthenticatedRequest, res: Response) => {
  const { text } = req.body as { text?: string };
  const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const userId = getUserId(req);
    const post = await createPost(userId, text?.trim(), imagePath);
    await post.populate("author", "username avatarPath");
    res.status(201).json({
      id: post.id,
      text: post.text,
      imageUrl: buildFileUrl(req, post.imagePath),
      createdAt: post.createdAt,
      likeCount: post.likeCount ?? 0,
      commentCount: post.commentCount ?? 0,
      hasLiked: false,
      author: serializeAuthor(req, post.author as unknown as UserDocument | mongoose.Types.ObjectId)
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const list = async (req: Request, res: Response) => {
  const requested = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(requested) ? Math.min(requested, 50) : 10;
  const cursor = parseCursor(req.query.cursor as string | undefined);

  const authHeader = req.headers.authorization;
  let userId: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(authHeader.replace("Bearer ", ""));
      userId = payload.sub;
    } catch {
      return res.status(401).json({ message: "Invalid access token" });
    }
  }

  const { posts, likedPostIds } = await listPosts(limit, cursor, userId);
  const items = posts.map((post) => ({
    id: post.id,
    text: post.text,
    imageUrl: buildFileUrl(req, post.imagePath),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    likeCount: post.likeCount ?? 0,
    commentCount: post.commentCount ?? 0,
    hasLiked: userId ? likedPostIds.has(post.id) : false,
    author: serializeAuthor(req, post.author as unknown as UserDocument | mongoose.Types.ObjectId)
  }));

  const last = posts[posts.length - 1];
  const nextCursor =
    last ? `${last.createdAt.toISOString()}|${last.id}` : null;

  res.json({ items, nextCursor });
};

export const search = async (req: Request, res: Response) => {
  const queryText = (req.query.q as string | undefined)?.trim() ?? "";
  if (!queryText) {
    return res.status(400).json({ message: "Query is required" });
  }
  const requested = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(requested) ? Math.min(requested, 50) : 10;

  const authHeader = req.headers.authorization;
  let userId: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(authHeader.replace("Bearer ", ""));
      userId = payload.sub;
    } catch {
      return res.status(401).json({ message: "Invalid access token" });
    }
  }

  const { posts, likedPostIds } = await searchPosts(queryText, limit, userId);
  const items = posts.map((post) => ({
    id: post.id,
    text: post.text,
    imageUrl: buildFileUrl(req, post.imagePath),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    likeCount: post.likeCount ?? 0,
    commentCount: post.commentCount ?? 0,
    hasLiked: userId ? likedPostIds.has(post.id) : false,
    author: serializeAuthor(req, post.author as unknown as UserDocument | mongoose.Types.ObjectId)
  }));

  res.json({ items });
};

export const patch = async (req: AuthenticatedRequest, res: Response) => {
  const { text } = req.body as { text?: string };
  try {
    const userId = getUserId(req);
    const post = await updatePost(req.params.id, userId, text?.trim());
    res.json({
      id: post.id,
      text: post.text,
      imageUrl: buildFileUrl(req, post.imagePath),
      updatedAt: post.updatedAt,
      likeCount: post.likeCount ?? 0,
      commentCount: post.commentCount ?? 0
    });
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    await deletePost(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};
