import { Post } from "../models/Post.js";
import { Like } from "../models/Like.js";

export const createPost = async (
  userId: string,
  text: string | undefined,
  imagePath: string | undefined
) => {
  if (!text && !imagePath) {
    throw new Error("Post must include text or image");
  }
  const post = await Post.create({
    author: userId,
    text,
    imagePath,
    commentCount: 0,
    likeCount: 0
  });
  return post;
};

export const listPosts = async (
  limit: number,
  cursor?: { createdAt: Date; id: string },
  userId?: string
) => {
  const query: Record<string, unknown> = {};
  if (cursor) {
    query.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      {
        createdAt: cursor.createdAt,
        _id: { $lt: cursor.id }
      }
    ];
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .populate("author", "username avatarPath");

  if (!userId) {
    return { posts, likedPostIds: new Set<string>() };
  }

  const postIds = posts.map((post) => post._id);
  const likes = await Like.find({ user: userId, post: { $in: postIds } }).select(
    "post"
  );
  const likedPostIds = new Set(likes.map((like) => like.post.toString()));
  return { posts, likedPostIds };
};

export const searchPosts = async (
  queryText: string,
  limit: number,
  userId?: string
) => {
  const posts = await Post.find({ $text: { $search: queryText } })
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .limit(limit)
    .populate("author", "username avatarPath");

  if (!userId) {
    return { posts, likedPostIds: new Set<string>() };
  }

  const postIds = posts.map((post) => post._id);
  const likes = await Like.find({ user: userId, post: { $in: postIds } }).select(
    "post"
  );
  const likedPostIds = new Set(likes.map((like) => like.post.toString()));
  return { posts, likedPostIds };
};

export const updatePost = async (
  postId: string,
  userId: string,
  text: string | undefined
) => {
  const post = await Post.findOne({ _id: postId, author: userId });
  if (!post) {
    throw new Error("Post not found");
  }
  if (text !== undefined) {
    post.text = text;
  }
  await post.save();
  return post;
};

export const deletePost = async (postId: string, userId: string) => {
  const post = await Post.findOneAndDelete({ _id: postId, author: userId });
  if (!post) {
    throw new Error("Post not found");
  }
  return post;
};
