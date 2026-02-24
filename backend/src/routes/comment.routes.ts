import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createComment,
  deleteComment,
  getCommentsByImage
} from "../controllers/comment.controller.js";

export const commentRouter = Router();

commentRouter.get("/image/:imageId", requireAuth as any, getCommentsByImage as any);
commentRouter.post("/image/:imageId", requireAuth as any, createComment as any);
commentRouter.delete("/:commentId", requireAuth as any, deleteComment as any);
