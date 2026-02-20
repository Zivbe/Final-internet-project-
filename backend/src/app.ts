import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { authRouter } from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { configurePassport } from "./config/passport.js";
import { env } from "./config/env.js";
import { swaggerSpec } from "./docs/swagger.js";
import swaggerUi from "swagger-ui-express";
import { userRouter } from "./routes/user.routes.js";
import { postRouter } from "./routes/post.routes.js";
import { uploadDir } from "./config/upload.js";
import { aiRouter } from "./routes/ai.routes.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true
    })
  );
  
  // JSON parser with error handling
  app.use(express.json({
    limit: '10mb',
    strict: true
  }));
  
  // Handle JSON parsing errors
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ 
        message: 'Invalid JSON in request body',
        error: 'Malformed request body'
      });
    }
    next(err);
  });
  
  app.use(cookieParser());

  app.use(
    session({
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false
    })
  );
  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // Request logging middleware (development only)
  if (env.nodeEnv === "development") {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.path}`, {
        body: req.method !== "GET" ? req.body : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined
      });
      next();
    });
  }

  app.use("/uploads", express.static(uploadDir));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/posts", postRouter);
  app.use("/api/ai", aiRouter);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Root route - API information
  app.get("/", (_req, res) => {
    res.json({
      message: "Fullstack App API",
      version: "1.0.0",
      endpoints: {
        docs: "/api/docs",
        health: "/api/health",
        auth: "/api/auth",
        users: "/api/users",
        posts: "/api/posts",
        ai: "/api/ai"
      }
    });
  });

  // 404 handler for undefined routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      message: "Route not found",
      availableRoutes: [
        "GET /",
        "GET /api/health",
        "GET /api/docs",
        "POST /api/auth/register",
        "POST /api/auth/login",
        "GET /api/users/me",
        "GET /api/posts",
        "POST /api/posts"
      ]
    });
  });

  app.use(errorHandler);

  return app;
};
