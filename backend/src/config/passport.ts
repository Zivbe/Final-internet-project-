import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import { User } from "../models/User.js";

export const configurePassport = (): void => {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleCallbackUrl) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value ?? "";
          const displayName = profile.displayName || email || "google-user";
          const photoUrl = profile.photos?.[0]?.value ?? "";

          let user = await User.findOne({ googleId });
          if (!user) {
            user = await User.create({
              username: displayName,
              googleId,
              photoUrl
            });
          } else if (!user.photoUrl && photoUrl) {
            user.photoUrl = photoUrl;
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user as Express.User));
};
