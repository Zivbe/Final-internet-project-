import { User } from "../models/User.js";

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const updateUsername = async (userId: string, username: string) => {
  const existing = await User.findOne({ username, _id: { $ne: userId } });
  if (existing) {
    throw new Error("Username already in use");
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { username },
    { new: true }
  );
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const updateAvatar = async (userId: string, avatarPath: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { avatarPath },
    { new: true }
  );
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};
