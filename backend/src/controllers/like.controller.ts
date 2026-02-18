import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getUserId } from "../middleware/auth.middleware.js";
import { likePost, unlikePost } from "../services/like.service.js";

export const like = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    await likePost(req.params.postId, userId);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const unlike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    await unlikePost(req.params.postId, userId);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
