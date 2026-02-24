import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  username: string;
};

export const signAccessToken = (payload: JwtPayload): string => {
  const options = { expiresIn: env.accessTokenTtl } as jwt.SignOptions;
  return jwt.sign(payload, env.accessTokenSecret as jwt.Secret, options);
};

export const signRefreshToken = (payload: JwtPayload): string => {
  const options = { expiresIn: env.refreshTokenTtl } as jwt.SignOptions;
  return jwt.sign(payload, env.refreshTokenSecret as jwt.Secret, options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.accessTokenSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.refreshTokenSecret) as JwtPayload;
};
