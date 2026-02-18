import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

const registerUser = async (username: string) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "Password123!" });
  return res.body.accessToken as string;
};

describe("Comments, likes, AI APIs", () => {
  it("creates comments and updates comment count", async () => {
    const token = await registerUser("dave");
    const postRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .field("text", "Hello world");

    const postId = postRes.body.id as string;

    const commentRes = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Nice post" });

    expect(commentRes.status).toBe(201);

    const feed = await request(app)
      .get("/api/posts")
      .set("Authorization", `Bearer ${token}`);

    expect(feed.body.items[0].commentCount).toBe(1);
  });

  it("likes and unlikes a post", async () => {
    const token = await registerUser("erin");
    const postRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .field("text", "Like me");

    const postId = postRes.body.id as string;

    const likeRes = await request(app)
      .post(`/api/posts/${postId}/likes`)
      .set("Authorization", `Bearer ${token}`);
    expect(likeRes.status).toBe(204);

    const feedAfterLike = await request(app)
      .get("/api/posts")
      .set("Authorization", `Bearer ${token}`);
    expect(feedAfterLike.body.items[0].likeCount).toBe(1);
    expect(feedAfterLike.body.items[0].hasLiked).toBe(true);

    const unlikeRes = await request(app)
      .delete(`/api/posts/${postId}/likes`)
      .set("Authorization", `Bearer ${token}`);
    expect(unlikeRes.status).toBe(204);
  });

  it("returns 503 when AI key is missing", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";
    
    const token = await registerUser("frank");
    const aiRes = await request(app)
      .post("/api/ai/summarize")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Some content" });

    expect(aiRes.status).toBe(503);
    expect(aiRes.body.message).toContain("not configured");
    
    // Restore original key
    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  });
});
