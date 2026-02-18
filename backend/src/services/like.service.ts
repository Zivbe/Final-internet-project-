import { Like } from "../models/Like.js";
import { Post } from "../models/Post.js";

export const likePost = async (postId: string, userId: string) => {
  try {
    const like = await Like.create({ post: postId, user: userId });
    await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });
    return like;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return null;
    }
    throw error;
  }
};

export const unlikePost = async (postId: string, userId: string) => {
  const like = await Like.findOneAndDelete({ post: postId, user: userId });
  if (!like) {
    return null;
  }
  await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });
  return like;
};
