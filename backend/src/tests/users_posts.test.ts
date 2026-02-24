import request from "supertest";
import { createApp } from "../app";

const app = createApp();

const registerAndLogin = async (username: string) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "Password123!" });

  return {
    token: res.body.accessToken as string,
    userId: res.body.user.id as string
  };
};

describe("Users and Posts API", () => {
  it("gets current user and updates username", async () => {
    const { token } = await registerAndLogin("user_profile_a");

    const me = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.username).toBe("user_profile_a");

    const update = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "user_profile_renamed" });
    expect(update.status).toBe(200);
    expect(update.body.user.username).toBe("user_profile_renamed");
  });

  it("creates, updates, and deletes own post", async () => {
    const { token } = await registerAndLogin("user_posts_a");

    const create = await request(app)
      .post("/api/images/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("description", "first post")
      .attach("image", Buffer.from("fake-image-content"), {
        filename: "post.png",
        contentType: "image/png"
      });

    expect(create.status).toBe(201);
    const imageId = create.body.image.id as string;

    const mine = await request(app)
      .get("/api/images/mine")
      .set("Authorization", `Bearer ${token}`);
    expect(mine.status).toBe(200);
    expect(mine.body.images.length).toBeGreaterThan(0);

    const update = await request(app)
      .patch(`/api/images/${imageId}`)
      .set("Authorization", `Bearer ${token}`)
      .field("description", "updated description");
    expect(update.status).toBe(200);
    expect(update.body.image.description).toBe("updated description");

    const del = await request(app)
      .delete(`/api/images/${imageId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(204);
  });

  it("prevents deleting another user's post", async () => {
    const owner = await registerAndLogin("user_posts_owner");
    const other = await registerAndLogin("user_posts_other");

    const create = await request(app)
      .post("/api/images/upload")
      .set("Authorization", `Bearer ${owner.token}`)
      .field("description", "owner post")
      .attach("image", Buffer.from("fake-image-content"), {
        filename: "owner.png",
        contentType: "image/png"
      });
    const imageId = create.body.image.id as string;

    const forbidden = await request(app)
      .delete(`/api/images/${imageId}`)
      .set("Authorization", `Bearer ${other.token}`);

    expect(forbidden.status).toBe(403);
  });
});
