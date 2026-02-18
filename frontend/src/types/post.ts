import type { User } from "./auth";

export type Post = {
  id: string;
  text?: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
  author: User;
};

export type PostListResponse = {
  items: Post[];
  nextCursor: string | null;
};
