import fs from "node:fs";
import path from "node:path";
import { APP_VERSION, API_VERSION, API_CONTRACT_REVISION } from "../config/version.js";
import { openapi } from "../docs/openapi.js";
import {
  buildFreezeSnapshot,
  contractKeys,
  executableRouteKeys,
  openApiKeys,
  projectRoot,
  readJson,
} from "./apiFreezeUtils.js";

const contract = readJson("docs/api-contract.json");
const manifest = readJson("docs/api-freeze-manifest.json");
const packageJson = readJson("package.json");

const failures = [];
const contractRouteKeys = contractKeys(contract);
const actualRouteKeys = executableRouteKeys();
const documentedRouteKeys = openApiKeys(openapi);

function compareSets(label, expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter((item) => !actualSet.has(item));
  const extra = actual.filter((item) => !expectedSet.has(item));
  if (missing.length || extra.length) {
    failures.push(`${label} mismatch. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`);
  }
}

if (new Set(contractRouteKeys).size !== contractRouteKeys.length) {
  failures.push("API contract contains duplicate method/path entries.");
}

compareSets("Executable routes vs API contract", contractRouteKeys, actualRouteKeys);
compareSets("OpenAPI paths vs API contract", contractRouteKeys, documentedRouteKeys);

if (packageJson.version !== APP_VERSION) {
  failures.push(`package.json version ${packageJson.version} does not match APP_VERSION ${APP_VERSION}.`);
}
if (openapi.info?.version !== APP_VERSION) {
  failures.push(`OpenAPI version ${openapi.info?.version} does not match APP_VERSION ${APP_VERSION}.`);
}
if (!openapi.servers?.some((server) => server.url === `/api/${API_VERSION}`)) {
  failures.push(`OpenAPI server must include /api/${API_VERSION}.`);
}

if (manifest.contractRevision !== API_CONTRACT_REVISION) {
  failures.push(`Freeze revision ${manifest.contractRevision} does not match API_CONTRACT_REVISION ${API_CONTRACT_REVISION}.`);
}

const snapshot = buildFreezeSnapshot({ contract, appVersion: APP_VERSION, apiVersion: API_VERSION, openapi });
for (const field of [
  "appVersion",
  "apiVersion",
  "contractEntries",
  "executableRoutes",
  "routeContractHash",
  "requestSurfaceHash",
  "responseSurfaceHash",
  "openApiSurfaceHash",
]) {
  if (manifest[field] !== snapshot[field]) {
    failures.push(`Frozen API baseline changed: ${field}. Expected ${manifest[field]}, received ${snapshot[field]}.`);
  }
}

if (failures.length) {
  console.error("API freeze check FAILED:\n- " + failures.join("\n- "));
  console.error("If this is an intentional API change, bump the contract revision with npm run api:freeze:update -- --revision <next> --reason \"<reason>\" and review whether APP_VERSION/API_VERSION also needs a bump.");
  process.exit(1);
}

console.log(`API freeze check passed: ${snapshot.executableRoutes} executable routes match ${snapshot.contractEntries} contract entries.`);
console.log(`Frozen baseline revision: ${manifest.contractRevision}. API ${API_VERSION}, app ${APP_VERSION}.`);
console.log("Route paths, request surface, response surface, OpenAPI surface and version alignment are unchanged.");
