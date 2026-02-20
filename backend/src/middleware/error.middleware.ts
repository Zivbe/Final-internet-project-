import type { NextFunction, Request, Response } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging
  console.error(`Error on ${req.method} ${req.path}:`, err.message);
  
  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({ 
      message: "Validation error",
      error: err.message 
    });
  }
  
  if (err.name === "CastError") {
    return res.status(400).json({ 
      message: "Invalid data format",
      error: err.message 
    });
  }
  
  // Default to 500 for unexpected errors
  res.status(500).json({ 
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};
