import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { searchImages, searchUsers } from "../controllers/search.controller.js";

export const searchRouter = Router();

/**
 * @openapi
 * /api/search/images:
 *   get:
 *     summary: Search images
 *     tags: [Search]
 */
searchRouter.get("/images", requireAuth as any, searchImages as any);
/**
 * @openapi
 * /api/search/users:
 *   get:
 *     summary: Search users
 *     tags: [Search]
 */
searchRouter.get("/users", requireAuth as any, searchUsers as any);
