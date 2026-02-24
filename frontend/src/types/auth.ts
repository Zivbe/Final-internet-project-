export type User = {
  id: string;
  username: string;
  photoUrl?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};
