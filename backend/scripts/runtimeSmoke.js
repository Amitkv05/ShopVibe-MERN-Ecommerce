import assert from "node:assert/strict";

const base = String(process.env.API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

async function check(path, expectedStatuses, verify) {
  const started = performance.now();
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  const elapsed = Math.round(performance.now() - started);
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  assert.ok(expectedStatuses.includes(response.status), `${path}: expected ${expectedStatuses.join("/")}, got ${response.status}: ${text}`);
  if (verify) verify(data, response);
  console.log(`PASS ${response.status} ${path} (${elapsed}ms)`);
}

await check("/health", [200], (data) => assert.equal(data?.success, true));
await check("/health/ready", [200], (data) => assert.equal(data?.database, "connected"));
await check("/categories", [200], (data) => assert.equal(data?.success, true));
await check("/products?limit=1", [200], (data) => assert.equal(data?.success, true));
await check("/cart", [401], (data) => assert.equal(data?.success, false));
await check("/admin/system", [401], (data) => assert.equal(data?.success, false));
await check("/definitely-not-a-route", [404], (data) => assert.equal(data?.success, false));
console.log("Runtime smoke checks passed.");
