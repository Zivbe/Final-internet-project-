import { Router } from "express";
import passport from "passport";
import { env } from "../config/env.js";
import { login, logout, refresh, register } from "../controllers/auth.controller.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { hashRefreshToken } from "../utils/refreshToken.js";
import { User } from "../models/User.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);

authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: true
  })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: true,
    failureRedirect: `${env.clientUrl}/login?error=oauth_failed`
  }),
  async (req, res) => {
    const user = req.user as { id: string; username: string } | undefined;
    if (!user) {
      return res.redirect(`${env.clientUrl}/login?error=oauth_failed`);
    }

    const accessToken = signAccessToken({ sub: user.id, username: user.username });
    const refreshToken = signRefreshToken({ sub: user.id, username: user.username });
    const refreshHash = hashRefreshToken(refreshToken);
    await User.findByIdAndUpdate(user.id, {
      $addToSet: { refreshTokenHashes: refreshHash }
    });

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.nodeEnv === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7
      })
      .redirect(`${env.clientUrl}/auth/callback?accessToken=${accessToken}`);
  }
);
