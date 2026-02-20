import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { toggleLike, getLikedBy } from "../controllers/like.controller.js";

export const likeRouter = Router();

likeRouter.post("/:imageId", requireAuth as any, toggleLike as any);
likeRouter.get("/:imageId", requireAuth as any, getLikedBy as any);
