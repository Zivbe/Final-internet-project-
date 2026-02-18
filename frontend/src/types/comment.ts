import type { User } from "./auth";

export type Comment = {
  id: string;
  text: string;
  createdAt: string;
  author: User;
};

export type CommentListResponse = {
  items: Comment[];
  nextCursor: string | null;
};
