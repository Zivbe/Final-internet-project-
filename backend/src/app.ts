import express from "express";
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

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use(errorHandler);

  return app;
};
