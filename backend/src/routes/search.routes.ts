import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { searchImages, searchUsers } from "../controllers/search.controller.js";

export const searchRouter = Router();

searchRouter.get("/images", requireAuth as any, searchImages as any);
searchRouter.get("/users", requireAuth as any, searchUsers as any);
