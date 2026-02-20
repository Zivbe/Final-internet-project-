import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getUserId } from "../middleware/auth.middleware.js";
import { summarizeText } from "../services/ai.service.js";

export const summarize = async (req: AuthenticatedRequest, res: Response) => {
  const { text } = req.body as { text?: string };
  try {
    const userId = getUserId(req);
    const result = await summarizeText(userId, text ?? "");
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("not configured") || message.includes("configured") ? 503 : 400;
    res.status(status).json({ message });
  }
};
