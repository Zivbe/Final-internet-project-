import dotenv from "dotenv";

dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? "4000"),
  mongoUri: required("MONGO_URI"),
  accessTokenSecret: required("JWT_ACCESS_SECRET"),
  refreshTokenSecret: required("JWT_REFRESH_SECRET"),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "replace_me",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini"
};
