import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

const start = async () => {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
