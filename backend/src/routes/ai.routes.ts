import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.middleware.js";
import { summarize } from "../controllers/ai.controller.js";

export const aiRouter = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @openapi
 * /api/ai/summarize:
 *   post:
 *     summary: Summarize and tag text with AI
 *     tags: [AI]
 */
aiRouter.post("/summarize", requireAuth, limiter, summarize);
