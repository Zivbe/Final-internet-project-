import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createComment,
  deleteComment,
  getCommentsByImage
} from "../controllers/comment.controller.js";

export const commentRouter = Router();

/**
 * @openapi
 * /api/comments/image/{imageId}:
 *   get:
 *     summary: List comments for an image
 *     tags: [Comments]
 */
commentRouter.get("/image/:imageId", requireAuth as any, getCommentsByImage as any);
/**
 * @openapi
 * /api/comments/image/{imageId}:
 *   post:
 *     summary: Add comment to image
 *     tags: [Comments]
 */
commentRouter.post("/image/:imageId", requireAuth as any, createComment as any);
/**
 * @openapi
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete own comment
 *     tags: [Comments]
 */
commentRouter.delete("/:commentId", requireAuth as any, deleteComment as any);
