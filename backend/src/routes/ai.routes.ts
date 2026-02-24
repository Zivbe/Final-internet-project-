import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { askFeedQuestion, getFeedInsights } from "../controllers/ai.controller.js";

export const aiRouter = Router();

/**
 * @openapi
 * /api/ai/insights:
 *   get:
 *     summary: Get AI feed insights
 *     tags: [AI]
 */
aiRouter.get("/insights", requireAuth as any, getFeedInsights as any);
/**
 * @openapi
 * /api/ai/query:
 *   post:
 *     summary: Ask a free-text AI question about feed content
 *     tags: [AI]
 */
aiRouter.post("/query", requireAuth as any, askFeedQuestion as any);
