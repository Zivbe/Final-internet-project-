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

userRouter.get("/me", requireAuth as any, getCurrentUser as any);
userRouter.patch("/me", requireAuth as any, updateMyProfile as any);
userRouter.patch("/me/photo", requireAuth as any, profileUpload.single("photo") as any, updateMyPhoto as any);
userRouter.get("/:userId", requireAuth as any, getUserProfile as any);
