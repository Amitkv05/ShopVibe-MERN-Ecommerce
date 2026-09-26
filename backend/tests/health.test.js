import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../app.js";

test("GET /api/v1/health returns API health", async () => {
  const response = await request(app).get("/api/v1/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.status, "ok");
});

test("unknown route returns 404 JSON", async () => {
  const response = await request(app).get("/api/v1/does-not-exist");
  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});


test("GET /api/v1/health/ready reports unavailable database when app is not connected", async () => {
  const response = await request(app).get("/api/v1/health/ready");
  assert.equal(response.status, 503);
  assert.equal(response.body.success, false);
});
