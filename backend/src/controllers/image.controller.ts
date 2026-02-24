import type { Response } from "express";
import { unlink } from "fs/promises";
import { Image } from "../models/Image.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { ImageResponse } from "../types/image.js";
import type { UserDocument } from "../models/User.js";

export const formatImageResponse = (image: any): ImageResponse => {
  const uploadedBy = typeof image.uploadedBy === "object" ? image.uploadedBy as UserDocument : null;
  const likes = Array.isArray(image.likes) 
    ? image.likes.map((like: any) => typeof like === "object" ? like as UserDocument : null).filter(Boolean) as UserDocument[]
    : [];

  return {
    id: image._id.toString(),
    filename: image.filename,
    originalName: image.originalName,
    url: image.filename ? `/uploads/images/${image.filename}` : "",
    uploadedBy: uploadedBy ? {
      id: uploadedBy._id.toString(),
      username: uploadedBy.username
    } : { id: "", username: "" },
    description: image.description,
    tags: image.tags || [],
    likeCount: image.likeCount || 0,
    commentCount: image.commentCount || 0,
    likes: likes.map((user: UserDocument) => ({
      id: user._id.toString(),
      username: user.username
    })),
    createdAt: image.createdAt
  };
};

export const uploadImage = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
  if (!req.file && !description) {
    return res.status(400).json({ message: "Either image or text is required" });
  }

  try {
    const image = await Image.create({
      filename: req.file?.filename ?? "",
      originalName: req.file?.originalname ?? "",
      mimeType: req.file?.mimetype ?? "",
      size: req.file?.size ?? 0,
      path: req.file?.path ?? "",
      uploadedBy: req.user.id,
      description,
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    });

    await image.populate("uploadedBy", "username");

    res.status(201).json({
      message: "Image uploaded successfully",
      image: formatImageResponse(image)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to save image", error });
  }
};

export const getImages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const images = await Image.find()
      .populate("uploadedBy", "username")
      .populate("likes", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Image.countDocuments();

    res.json({
      images: images.map(formatImageResponse),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch images", error });
  }
};

export const getMyImages = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query = { uploadedBy: req.user.id };
    const images = await Image.find(query)
      .populate("uploadedBy", "username")
      .populate("likes", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Image.countDocuments(query);

    res.json({
      images: images.map(formatImageResponse),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your images", error });
  }
};

export const getImageById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id)
      .populate("uploadedBy", "username")
      .populate("likes", "username");

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json(formatImageResponse(image));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch image", error });
  }
};

export const updateImage = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (image.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own content" });
    }

    if (typeof req.body.description === "string") {
      image.description = req.body.description;
    }

    if (typeof req.body.tags === "string") {
      image.tags = JSON.parse(req.body.tags);
    }

    if (req.file) {
      const oldPath = image.path;
      image.filename = req.file.filename;
      image.originalName = req.file.originalname;
      image.mimeType = req.file.mimetype;
      image.size = req.file.size;
      image.path = req.file.path;
      if (oldPath && oldPath !== req.file.path) {
        unlink(oldPath).catch(() => {});
      }
    }

    await image.save();
    await image.populate("uploadedBy", "username");
    await image.populate("likes", "username");

    res.json({
      message: "Image updated successfully",
      image: formatImageResponse(image)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update image", error });
  }
};

export const deleteImage = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (image.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own content" });
    }

    const imagePath = image.path;
    await image.deleteOne();
    if (imagePath) {
      unlink(imagePath).catch(() => {});
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete image", error });
  }
};
