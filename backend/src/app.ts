import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { authRouter } from "./routes/auth.routes.js";
import { imageRouter } from "./routes/image.routes.js";
import { likeRouter } from "./routes/like.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { aiRouter } from "./routes/ai.routes.js";
import { commentRouter } from "./routes/comment.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { configurePassport } from "./config/passport.js";
import { env } from "./config/env.js";
import { swaggerSpec } from "./docs/swagger.js";
import swaggerUi from "swagger-ui-express";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  
  // Serve uploaded images statically
  app.use("/uploads", express.static("uploads"));

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

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api/auth", authRouter);
  app.use("/api/images", imageRouter);
  app.use("/api/likes", likeRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/comments", commentRouter);
  app.use("/api/users", userRouter);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use(errorHandler);

  return app;
};
