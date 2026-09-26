import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import APIFunctionality from "../utils/apiFunctionality.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("T-126/T-127/T-128 cancellation rules only allow Processing orders", async () => {
  const source = await read("controller/orderController.js");
  const routes = await read("routes/orderRoutes.js");
  assert.match(source, /order\.orderStatus\s*!==\s*["']Processing["']/);
  assert.match(source, /Only processing orders can be cancelled/);
  assert.match(routes, /router\.post\(["']\/order\/:id\/cancel["']/m);
});

test("T-130 cancellation restores inventory only once", async () => {
  const source = await read("controller/orderController.js");
  assert.match(source, /if\s*\(!order\.inventoryRestored\)/);
  assert.match(source, /await\s+restoreInventory\(/);
  assert.match(source, /order\.inventoryRestored\s*=\s*true/);
});

test("T-131 cancellation status email is wired", async () => {
  const source = await read("controller/orderController.js");
  const notifications = await read("services/notificationService.js");
  assert.match(source, /sendOrderStatusEmail\(user,\s*order\)/);
  assert.match(notifications, /order\.orderStatus\s*===\s*["']Cancelled["']/);
  assert.match(notifications, /cancellationReason/);
  assert.match(notifications, /Payment refund status:\s*refunded/);
});

test("T-139 deleting a product cleans attached Cloudinary assets", async () => {
  const source = await read("controller/productController.js");
  assert.match(source, /deleteCloudinaryImage/);
  assert.match(source, /cleanupCloudinaryImages\(images,/);
  assert.match(source, /operation:\s*["']product-delete["']/);
  assert.match(source, /Cart\.updateMany/);
  assert.match(source, /Wishlist\.updateMany/);
});



test("T-171 Mongo/operator injection guard is globally wired before routes and unsafe order-status objects are rejected", async () => {
  const app = await read("app.js");
  const middleware = await read("middleware/rejectMongoOperators.js");
  const orders = await read("controller/orderController.js");
  const guardPos = app.indexOf("app.use(rejectMongoOperators)");
  const routePos = app.indexOf("app.use(\"/api/v1\", routes)");
  assert.ok(guardPos >= 0 && routePos >= 0 && guardPos < routePos);
  assert.match(middleware, /key\.startsWith\(["']\$["']\)/);
  assert.match(middleware, /containsUnsafeMongoKey\(req\.body\)/);
  assert.match(middleware, /containsUnsafeMongoKey\(req\.query\)/);
  assert.match(orders, /typeof value !== ["']string["']/);
  assert.match(orders, /ORDER_STATUSES\.has\(status\)/);
});

test("T-172 invalid Mongo ObjectIds are normalized to controlled 404 errors", async () => {
  const source = await read("middleware/error.js");
  assert.match(source, /err\?\.name\s*===\s*["']CastError["']/);
  assert.match(source, /Invalid \$\{err\.path\}/);
  assert.match(source, /404/);
});

test("T-173 source package excludes real env files and redacts common secrets", async () => {
  // A developer machine legitimately needs local .env files. Their presence should
  // not make the normal local test suite fail; the release/CI gate enforces that
  // secret files are not shipped. Here we verify the ignore policy and redaction.
  const rootGitignore = await readFile(new URL("../../.gitignore", import.meta.url), "utf8");
  const backendGitignore = await readFile(new URL("../.gitignore", import.meta.url), "utf8");

  assert.match(rootGitignore, /^\.env\*/m);
  assert.match(rootGitignore, /^!\.env\.example$/m);
  assert.match(rootGitignore, /^backend\/\.env\*/m);
  assert.match(rootGitignore, /^frontend\/\.env\*/m);
  assert.match(backendGitignore, /^\.env\*/m);
  assert.match(backendGitignore, /^!\.env\.example$/m);

  // In CI/release packaging, real env files must still be absent.
  if (process.env.CI === "true") {
    for (const file of [".env", ".env copy", ".env copy 2"]) {
      await assert.rejects(access(new URL(`../${file}`, import.meta.url), constants.F_OK));
    }
  }

  const logger = await read("config/logger.js");
  const app = await read("app.js");
  for (const field of ["password", "token", "smtpPassword", "jwtSecret", "razorpayKeySecret", "cloudinaryApiSecret"]) {
    assert.match(logger, new RegExp(field));
  }
  assert.match(app, /req\.headers\.authorization/);
  assert.match(app, /req\.headers\.cookie/);
  assert.match(app, /res\.headers\.set-cookie/);
});

test("T-191 product pagination caps oversized requested limits", () => {
  const state = { limit: null, skip: null };
  const query = {
    limit(value) { state.limit = value; return this; },
    skip(value) { state.skip = value; return this; },
  };
  const features = new APIFunctionality(query, { page: "2", limit: "999999" });
  features.pagination(12, 50);
  assert.equal(features.limit, 50);
  assert.equal(features.page, 2);
  assert.equal(state.limit, 50);
  assert.equal(state.skip, 50);
});
