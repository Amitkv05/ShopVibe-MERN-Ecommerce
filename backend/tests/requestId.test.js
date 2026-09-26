import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { APP_VERSION } from "../config/version.js";

process.env.NODE_ENV = "test";
process.env.DB_URI ||= "mongodb://127.0.0.1:27017/test";
process.env.JWT_SECRET_KEY ||= "test_secret_that_is_long_enough_for_phase_three";
process.env.CLIENT_URL ||= "http://localhost:5173";

const { default: app } = await import("../app.js");

test("health responses include request correlation headers", async () => {
  const response = await request(app)
    .get("/api/v1/health")
    .set("X-Request-Id", "phase3-test-request");

  assert.equal(response.status, 200);
  assert.equal(response.headers["x-request-id"], "phase3-test-request");
  assert.equal(response.headers["x-api-version"], APP_VERSION);
  assert.equal(response.body.requestId, "phase3-test-request");
});

test("error responses include a generated request id", async () => {
  const response = await request(app).get("/api/v1/route-that-does-not-exist");

  assert.equal(response.status, 404);
  assert.match(response.headers["x-request-id"], /^[A-Za-z0-9._:-]+$/);
  assert.equal(response.body.requestId, response.headers["x-request-id"]);
});
