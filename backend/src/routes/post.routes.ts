import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { create, list, patch, remove, search } from "../controllers/post.controller.js";
import { upload } from "../config/upload.js";
import { commentRouter } from "./comment.routes.js";
import { like, unlike } from "../controllers/like.controller.js";

export const postRouter = Router();

/**
 * @openapi
 * /api/posts:
 *   get:
 *     summary: List posts with pagination
 *     tags: [Posts]
 */
postRouter.get("/", list);

/**
 * @openapi
 * /api/posts/search:
 *   get:
 *     summary: Search posts by text
 *     tags: [Posts]
 */
postRouter.get("/search", search);

/**
 * @openapi
 * /api/posts:
 *   post:
 *     summary: Create a post
 *     tags: [Posts]
 */
postRouter.post("/", requireAuth, upload.single("image"), create);

/**
 * @openapi
 * /api/posts/{id}:
 *   patch:
 *     summary: Update a post
 *     tags: [Posts]
 */
postRouter.patch("/:id", requireAuth, patch);

/**
 * @openapi
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 */
postRouter.delete("/:id", requireAuth, remove);

/**
 * @openapi
 * /api/posts/{postId}/likes:
 *   post:
 *     summary: Like a post
 *     tags: [Likes]
 */
postRouter.post("/:postId/likes", requireAuth, like);

/**
 * @openapi
 * /api/posts/{postId}/likes:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Likes]
 */
postRouter.delete("/:postId/likes", requireAuth, unlike);

postRouter.use("/:postId/comments", commentRouter);
