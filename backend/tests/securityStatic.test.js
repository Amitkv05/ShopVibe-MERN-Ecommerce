import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { containsUnsafeMongoKey } from "../middleware/rejectMongoOperators.js";

test("Mongo operator detector rejects operator and prototype-pollution keys", () => {
  assert.equal(containsUnsafeMongoKey({ status: { $ne: "Cancelled" } }), true);
  assert.equal(containsUnsafeMongoKey({ nested: [{ $regex: ".*" }] }), true);
  assert.equal(containsUnsafeMongoKey({ constructor: { prototype: {} } }), true);
  assert.equal(containsUnsafeMongoKey({ price: { gte: 10, lte: 20 } }), false);
});

test("secret-copy files are absent and ignore rules cover env variants", async () => {
  for (const file of [".env copy", ".env copy 2"]) {
    await assert.rejects(access(new URL(`../${file}`, import.meta.url), constants.F_OK));
  }
  const gitignore = await readFile(new URL("../.gitignore", import.meta.url), "utf8");
  const dockerignore = await readFile(new URL("../.dockerignore", import.meta.url), "utf8");
  assert.match(gitignore, /^\.env\*/m);
  assert.match(gitignore, /^!\.env\.example$/m);
  assert.match(dockerignore, /^\.env\*/m);
});
