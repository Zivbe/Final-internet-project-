export type User = {
  id: string;
  username: string;
  avatarUrl?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};
