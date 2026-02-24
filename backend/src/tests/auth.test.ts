import request from "supertest";
import { createApp } from "../app";

const app = createApp();

describe("Auth API", () => {
  it("registers and logs in a user", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({ username: "alice", password: "Password123!" });

    expect(register.status).toBe(201);
    expect(register.body.accessToken).toBeDefined();
    expect(register.body.user.username).toBe("alice");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "alice", password: "Password123!" });

    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeDefined();
  });

  it("refreshes access tokens", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({ username: "bob", password: "Password123!" });

    const cookies = register.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const refresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookies);

    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeDefined();
  });

  it("logs out and clears refresh token", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({ username: "carol", password: "Password123!" });

    const cookies = register.headers["set-cookie"];
    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookies);

    expect(logout.status).toBe(204);
  });
});
