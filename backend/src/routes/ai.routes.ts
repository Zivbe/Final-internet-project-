import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { askFeedQuestion, getFeedInsights } from "../controllers/ai.controller.js";

export const aiRouter = Router();

aiRouter.get("/insights", requireAuth as any, getFeedInsights as any);
aiRouter.post("/query", requireAuth as any, askFeedQuestion as any);
