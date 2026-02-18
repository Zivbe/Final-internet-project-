import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { create, list, remove } from "../controllers/comment.controller.js";

export const commentRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: List comments for a post
 *     tags: [Comments]
 */
commentRouter.get("/", list);

/**
 * @openapi
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Comments]
 */
commentRouter.post("/", requireAuth, create);

/**
 * @openapi
 * /api/posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 */
commentRouter.delete("/:commentId", requireAuth, remove);
