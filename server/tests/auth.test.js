import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";

let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDatabase(mongo.getUri());
  app = createApp();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDatabase();
  await mongo.stop();
});

describe("auth routes", () => {
  it("registers and authenticates a user", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "Password123!"
      })
      .expect(201);

    expect(register.body.user.email).toBe("test@example.com");
    expect(register.body.token).toBeTruthy();

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${register.body.token}`)
      .expect(200);

    expect(me.body.user.name).toBe("Test User");
  });
});

