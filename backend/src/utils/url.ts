import type { Request } from "express";

export const buildFileUrl = (req: Request, filePath?: string | null) => {
  if (!filePath) {
    return null;
  }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}${filePath}`;
};
