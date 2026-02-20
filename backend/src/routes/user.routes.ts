import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getMe, patchMe, uploadAvatar } from "../controllers/user.controller.js";
import { upload } from "../config/upload.js";

export const userRouter = Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get the current user profile
 *     tags: [Users]
 */
userRouter.get("/me", requireAuth, getMe);

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 */
userRouter.patch("/me", requireAuth, patchMe);

/**
 * @openapi
 * /api/users/me/avatar:
 *   post:
 *     summary: Upload avatar for current user
 *     tags: [Users]
 */
userRouter.post("/me/avatar", requireAuth, upload.single("image"), uploadAvatar);
