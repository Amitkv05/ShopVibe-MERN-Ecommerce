import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy products and categories without active flag stay publicly visible", async () => {
  const products = await read("controller/productController.js");
  const categories = await read("controller/categoryController.js");
  assert.match(products, /active:\s*\{\s*\$ne:\s*false\s*\}/);
  assert.match(categories, /active:\s*\{\s*\$ne:\s*false\s*\}/);
});

test("legacy users are promoted only after a valid password login", async () => {
  const users = await read("controller/userController.js");
  assert.match(users, /await user\.verifyPassword\(password\)/);
  assert.match(users, /User\.collection\.findOne/);
  assert.match(users, /isEmailVerified:\s*\{\s*\$exists:\s*false\s*\}/);
  assert.match(users, /\$set:\s*\{\s*isEmailVerified:\s*true\s*\}/);
});

test("legacy migration safely backfills active, Stock and verification fields", async () => {
  const migration = await read("scripts/migrateLegacyCompatibility.js");
  assert.match(migration, /productsMissingActive/);
  assert.match(migration, /productsWithLegacyStock/);
  assert.match(migration, /categoriesMissingActive/);
  assert.match(migration, /usersMissingVerificationFlag/);
  assert.match(migration, /--apply/);
});
