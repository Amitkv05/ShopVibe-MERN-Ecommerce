import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import APIFunctionality from "../utils/apiFunctionality.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function mustMatch(source, patterns) {
  for (const pattern of patterns) assert.match(source, pattern);
}

function fakeQueryState() {
  const state = { find: null, sort: null, limit: null, skip: null };
  const query = {
    find(value) { state.find = value; return this; },
    sort(value) { state.sort = value; return this; },
    limit(value) { state.limit = value; return this; },
    skip(value) { state.skip = value; return this; },
  };
  return { query, state };
}

test("T-185/T-186 product list and search are performance-bounded and indexed", async () => {
  const { query, state } = fakeQueryState();
  const longKeyword = `${"a".repeat(120)}.*`;
  const features = new APIFunctionality(query, {
    keyword: longKeyword,
    page: "999999",
    limit: "999999",
    sort: "not-allowed",
  });
  features.search().sort().pagination(12, 50);

  assert.equal(state.limit, 50);
  assert.equal(features.limit, 50);
  assert.equal(features.page, 999999);
  assert.equal(state.sort, "-createdAt");
  assert.equal(typeof state.find?.name?.$regex, "string");
  assert.ok(state.find.name.$regex.length <= 104, "search regex must remain bounded and escaped");
  assert.ok(!state.find.name.$regex.endsWith(".*"), "regex metacharacters should be escaped");

  const model = await read("models/productModel.js");
  const app = await read("app.js");
  mustMatch(model, [
    /productSchema\.index\(\{ active: 1, category: 1, price: 1 \}\)/,
    /productSchema\.index\(\{ active: 1, ratings: -1 \}\)/,
    /productSchema\.index\(\{ active: 1, createdAt: -1 \}\)/,
  ]);
  assert.match(app, /app\.use\(compression\(\)\)/);
});

test("T-187 login load protection is configured independently from generic API limiting", async () => {
  const limiter = await read("middleware/rateLimit.js");
  const routes = await read("routes/userRoutes.js");
  mustMatch(limiter, [
    /apiLimiter[\s\S]*limit:\s*300/,
    /authLimiter[\s\S]*limit:\s*20/,
    /skipSuccessfulRequests:\s*true/,
  ]);
  mustMatch(routes, [/\/login["'],\s*authLimiter/]);
});

test("T-188 checkout concurrency protection uses idempotency, transactions and atomic stock predicates", async () => {
  const order = await read("controller/orderController.js");
  const persistence = await read("services/orderPersistenceService.js");
  const cart = await read("services/cartService.js");
  const orderModel = await read("models/orderModel.js");
  mustMatch(order, [/Idempotency-Key/, /idempotentReplay/]);
  mustMatch(persistence, [/withTransaction/, /readConcern:\s*\{ level: ["']snapshot["'] \}/, /writeConcern:\s*\{ w: ["']majority["'] \}/]);
  mustMatch(cart, [/stock:\s*\{\s*\$gte:\s*item\.quantity\s*\}/, /findOneAndUpdate/]);
  mustMatch(orderModel, [/idempotencyKey[\s\S]*unique:\s*true|index\(\{ idempotencyKey: 1 \}/]);
});

test("T-189 system diagnostics expose CPU and RAM metrics", async () => {
  const system = await read("controller/systemController.js");
  mustMatch(system, [
    /process\.memoryUsage\(\)/,
    /process\.cpuUsage\(\)/,
    /memoryMb:/,
    /cpu:/,
    /logicalCores:/,
  ]);
});

test("T-190 system diagnostics measure live MongoDB ping latency", async () => {
  const system = await read("controller/systemController.js");
  mustMatch(system, [
    /performance\.now\(\)/,
    /db\.db\.admin\(\)\.command\(\{ ping: 1 \}\)/,
    /pingMs/,
  ]);
});

test("Step 18 performance load harness is available for product list, search and optional login", async () => {
  const harness = await read("scripts/performanceLoad.js");
  mustMatch(harness, [
    /product-list/,
    /product-search/,
    /login/,
    /PERF_BASE_URL/,
    /PERF_CONCURRENCY/,
    /PERF_REQUESTS/,
    /p95/,
  ]);
});
