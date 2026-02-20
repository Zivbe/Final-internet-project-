export type ImageResponse = {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  uploadedBy: {
    id: string;
    username: string;
  };
  description?: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  likes: Array<{ id: string; username: string }>;
  createdAt: Date;
};
