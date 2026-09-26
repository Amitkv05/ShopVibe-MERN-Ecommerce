import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
process.env.NODE_ENV = "test";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.JWT_SECRET_KEY = "test_secret_that_is_long_enough_for_automated_tests_123";
const { default: app } = await import("../app.js");

test("protected cart endpoint rejects anonymous users", async () => {
  const response = await request(app).get("/api/v1/cart");
  assert.equal(response.status, 401);
});

test("register validates malformed email before database access", async () => {
  const response = await request(app).post("/api/v1/register").send({ name: "Test User", email: "not-an-email", password: "password123" });
  assert.equal(response.status, 400);
});

test("unknown endpoint returns 404", async () => {
  const response = await request(app).get("/api/v1/does-not-exist");
  assert.equal(response.status, 404);
});


test("login rejects NoSQL operator objects before database access", async () => {
  const response = await request(app).post("/api/v1/login").send({
    email: { $ne: null },
    password: { $ne: null },
  });
  assert.equal(response.status, 400);
});

test("query-string Mongo operators are rejected before controller execution", async () => {
  const response = await request(app).get("/api/v1/products?keyword[$ne]=phone");
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});
