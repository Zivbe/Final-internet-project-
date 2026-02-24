import request from "supertest";
import { createApp } from "../app";

const app = createApp();

const registerAndLogin = async (username: string) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "Password123!" });

  return {
    token: res.body.accessToken as string
  };
};

describe("Comments, Likes, and AI API", () => {
  it("adds comments and likes to a post", async () => {
    const owner = await registerAndLogin("user_interact_owner");
    const other = await registerAndLogin("user_interact_other");

    const create = await request(app)
      .post("/api/images/upload")
      .set("Authorization", `Bearer ${owner.token}`)
      .field("description", "interaction post")
      .attach("image", Buffer.from("fake-image-content"), {
        filename: "interaction.png",
        contentType: "image/png"
      });

    const imageId = create.body.image.id as string;

    const comment = await request(app)
      .post(`/api/comments/image/${imageId}`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ text: "Nice post!" });
    expect(comment.status).toBe(201);

    const comments = await request(app)
      .get(`/api/comments/image/${imageId}`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(comments.status).toBe(200);
    expect(comments.body.comments.length).toBeGreaterThan(0);

    const like = await request(app)
      .post(`/api/likes/${imageId}`)
      .set("Authorization", `Bearer ${other.token}`);
    expect(like.status).toBe(200);
    expect(like.body.liked).toBe(true);

    const likes = await request(app)
      .get(`/api/likes/${imageId}`)
      .set("Authorization", `Bearer ${owner.token}`);
    expect(likes.status).toBe(200);
    expect(likes.body.likeCount).toBeGreaterThanOrEqual(1);
  });

  it("supports AI endpoints (or returns not configured)", async () => {
    const user = await registerAndLogin("user_ai_case");

    const create = await request(app)
      .post("/api/images/upload")
      .set("Authorization", `Bearer ${user.token}`)
      .field("description", "AI sample post")
      .attach("image", Buffer.from("fake-image-content"), {
        filename: "ai-post.png",
        contentType: "image/png"
      });
    expect(create.status).toBe(201);

    const insights = await request(app)
      .get("/api/ai/insights?scope=all")
      .set("Authorization", `Bearer ${user.token}`);
    expect([200, 501]).toContain(insights.status);

    const query = await request(app)
      .post("/api/ai/query")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ question: "Summarize this feed", scope: "all" });
    expect([200, 501]).toContain(query.status);
  });
});
