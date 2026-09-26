import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { APP_VERSION, API_VERSION } from "../config/version.js";
import { openapi } from "../docs/openapi.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

test("frozen API baseline check passes", () => {
  const output = execFileSync(process.execPath, ["scripts/checkApiFreeze.js"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.match(output, /API freeze check passed/);
});

test("OpenAPI version and server are derived from version constants", () => {
  assert.equal(openapi.info.version, APP_VERSION);
  assert.ok(openapi.servers.some((server) => server.url === `/api/${API_VERSION}`));
});

test("API freeze baseline is revisioned and records route/request/response fingerprints", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs/api-freeze-manifest.json"), "utf8"));
  assert.ok(Number.isInteger(manifest.contractRevision));
  assert.ok(manifest.contractRevision >= 1);
  for (const key of ["routeContractHash", "requestSurfaceHash", "responseSurfaceHash", "openApiSurfaceHash"]) {
    assert.match(manifest[key], /^[a-f0-9]{64}$/);
  }
});
