import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { profileUpload } from "../middleware/profileUpload.middleware.js";
import {
  getCurrentUser,
  getUserProfile,
  updateMyProfile,
  updateMyPhoto
} from "../controllers/user.controller.js";

export const userRouter = Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 */
userRouter.get("/me", requireAuth as any, getCurrentUser as any);
/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     summary: Update current user profile (username)
 *     tags: [Users]
 */
userRouter.patch("/me", requireAuth as any, updateMyProfile as any);
/**
 * @openapi
 * /api/users/me/photo:
 *   patch:
 *     summary: Update current user profile photo
 *     tags: [Users]
 */
userRouter.patch("/me/photo", requireAuth as any, profileUpload.single("photo") as any, updateMyPhoto as any);
/**
 * @openapi
 * /api/users/{userId}:
 *   get:
 *     summary: Get user public profile with posts
 *     tags: [Users]
 */
userRouter.get("/:userId", requireAuth as any, getUserProfile as any);
