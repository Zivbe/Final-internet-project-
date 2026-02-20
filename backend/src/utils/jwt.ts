import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  username: string;
};

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.accessTokenSecret, {
    expiresIn: env.accessTokenTtl
  } as jwt.SignOptions);
};

export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenTtl
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.accessTokenSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.refreshTokenSecret) as JwtPayload;
};
