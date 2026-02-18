import { Comment } from "../models/Comment.js";
import { Post } from "../models/Post.js";

export const createComment = async (
  postId: string,
  userId: string,
  text: string
) => {
  const comment = await Comment.create({
    post: postId,
    author: userId,
    text
  });
  await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
  return comment;
};

export const listComments = async (
  postId: string,
  limit: number,
  cursor?: { createdAt: Date; id: string }
) => {
  const query: Record<string, unknown> = { post: postId };
  if (cursor) {
    query.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } }
    ];
  }

  const comments = await Comment.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .populate("author", "username avatarPath");

  return comments;
};

export const deleteComment = async (
  commentId: string,
  userId: string
) => {
  const comment = await Comment.findOneAndDelete({
    _id: commentId,
    author: userId
  });
  if (!comment) {
    throw new Error("Comment not found");
  }
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
  return comment;
};
