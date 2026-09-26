import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.JWT_SECRET_KEY = "test_secret_that_is_long_enough_for_automated_tests_123";

const { default: app } = await import("../app.js");

const protectedRoutes = [
  ["post", "/api/v1/cart/items", { product: "64b13c995857d2061da4dc05", quantity: 1 }],
  ["get", "/api/v1/cart"],
  ["post", "/api/v1/wishlist/64b13c995857d2061da4dc05"],
  ["get", "/api/v1/wishlist"],
  ["get", "/api/v1/addresses"],
  ["get", "/api/v1/admin/system"],
  ["get", "/api/v1/admin/analytics"],
  ["get", "/api/v1/admin/categories"],
  ["get", "/api/v1/admin/coupons"],
  ["get", "/api/v1/admin/inventory/low-stock"],
];

for (const [method, path, body] of protectedRoutes) {
  test(`${method.toUpperCase()} ${path} is mounted (anonymous request returns 401, not 404)`, async () => {
    let call = request(app)[method](path);
    if (body) call = call.send(body);
    const response = await call;
    assert.equal(response.status, 401);
    assert.notEqual(response.body?.message?.startsWith?.("Route not found"), true);
  });
}

test("public categories route is present in the checked API contract", async () => {
  const contract = JSON.parse(await readFile(new URL("../docs/api-contract.json", import.meta.url), "utf8"));
  assert.ok(contract.some((route) => route.method === "GET" && route.path === "/categories"));
});
