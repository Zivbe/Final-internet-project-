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

/**
 * @openapi
 * /api/images/upload:
 *   post:
 *     summary: Upload a new image post
 *     tags: [Posts]
 */
imageRouter.post("/upload", requireAuth as any, upload.single("image") as any, uploadImage as any);
/**
 * @openapi
 * /api/images:
 *   get:
 *     summary: Get feed posts with pagination
 *     tags: [Posts]
 */
imageRouter.get("/", requireAuth as any, getImages as any);
/**
 * @openapi
 * /api/images/mine:
 *   get:
 *     summary: Get current user's posts
 *     tags: [Posts]
 */
imageRouter.get("/mine", requireAuth as any, getMyImages as any);
/**
 * @openapi
 * /api/images/{id}:
 *   get:
 *     summary: Get single post by id
 *     tags: [Posts]
 */
imageRouter.get("/:id", requireAuth as any, getImageById as any);
/**
 * @openapi
 * /api/images/{id}:
 *   patch:
 *     summary: Update own post (text/image)
 *     tags: [Posts]
 */
imageRouter.patch("/:id", requireAuth as any, upload.single("image") as any, updateImage as any);
/**
 * @openapi
 * /api/images/{id}:
 *   delete:
 *     summary: Delete own post
 *     tags: [Posts]
 */
imageRouter.delete("/:id", requireAuth as any, deleteImage as any);
