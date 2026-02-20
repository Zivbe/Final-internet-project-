import { User } from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { hashRefreshToken } from "../utils/refreshToken.js";
import {
  signAccessToken,
  signRefreshToken,
  type JwtPayload
} from "../utils/jwt.js";

export const registerUser = async (username: string, password: string) => {
  const existing = await User.findOne({ username });
  if (existing) {
    throw new Error("Username already in use");
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ username, passwordHash });
  const tokens = issueTokens(user.id, user.username, user.photoUrl ?? "");
  user.refreshTokenHashes = [
    ...(user.refreshTokenHashes ?? []),
    hashRefreshToken(tokens.refreshToken)
  ];
  await user.save();
  return tokens;
};

export const loginUser = async (username: string, password: string) => {
  const user = await User.findOne({ username });
  if (!user || !user.passwordHash) {
    throw new Error("Invalid credentials");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new Error("Invalid credentials");
  }

  const tokens = issueTokens(user.id, user.username, user.photoUrl ?? "");
  user.refreshTokenHashes = [
    ...(user.refreshTokenHashes ?? []),
    hashRefreshToken(tokens.refreshToken)
  ];
  await user.save();
  return tokens;
};

export const rotateRefreshToken = async (
  userId: string,
  username: string,
  refreshToken: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const refreshHash = hashRefreshToken(refreshToken);
  const stored = user.refreshTokenHashes ?? [];
  if (!stored.includes(refreshHash)) {
    throw new Error("Refresh token revoked");
  }

  user.refreshTokenHashes = stored.filter((hash) => hash !== refreshHash);
  const tokens = issueTokens(user.id, username, user.photoUrl ?? "");
  const newHash = hashRefreshToken(tokens.refreshToken);
  user.refreshTokenHashes.push(newHash);
  await user.save();

  return tokens;
};

export const revokeRefreshToken = async (
  userId: string,
  refreshToken: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  const refreshHash = hashRefreshToken(refreshToken);
  user.refreshTokenHashes = (user.refreshTokenHashes ?? []).filter(
    (hash) => hash !== refreshHash
  );
  await user.save();
};

const issueTokens = (userId: string, username: string, photoUrl: string) => {
  const payload: JwtPayload = { sub: userId, username };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: { id: userId, username, photoUrl }
  };
};
