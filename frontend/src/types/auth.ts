export type User = {
  id: string;
  username: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};
