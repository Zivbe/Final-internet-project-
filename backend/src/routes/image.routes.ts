import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  uploadImage,
  getImages,
  getImageById,
  getMyImages,
  updateImage,
  deleteImage
} from "../controllers/image.controller.js";

export const imageRouter = Router();

imageRouter.post("/upload", requireAuth as any, upload.single("image") as any, uploadImage as any);
imageRouter.get("/", requireAuth as any, getImages as any);
imageRouter.get("/mine", requireAuth as any, getMyImages as any);
imageRouter.get("/:id", requireAuth as any, getImageById as any);
imageRouter.patch("/:id", requireAuth as any, upload.single("image") as any, updateImage as any);
imageRouter.delete("/:id", requireAuth as any, deleteImage as any);
