import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { toggleLike, getLikedBy } from "../controllers/like.controller.js";

export const likeRouter = Router();

/**
 * @openapi
 * /api/likes/{imageId}:
 *   post:
 *     summary: Toggle like/unlike on image
 *     tags: [Likes]
 */
likeRouter.post("/:imageId", requireAuth as any, toggleLike as any);
/**
 * @openapi
 * /api/likes/{imageId}:
 *   get:
 *     summary: Get users who liked the image
 *     tags: [Likes]
 */
likeRouter.get("/:imageId", requireAuth as any, getLikedBy as any);
