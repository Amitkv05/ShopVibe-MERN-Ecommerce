import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const projectRoot = path.resolve(__dirname, "..");

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), "utf8"));
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function canonicalContract(contract) {
  return [...contract]
    .map(({ method, path: routePath, area, auth, frontend, special = false }) => ({
      method: String(method).toUpperCase(),
      path: routePath,
      area,
      auth,
      frontend: Boolean(frontend),
      special: Boolean(special),
    }))
    .sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));
}

function normalizedFileContent(relativePath) {
  return fs
    .readFileSync(path.join(projectRoot, relativePath), "utf8")
    .replace(/\r\n/g, "\n");
}

export function hashFiles(relativePaths) {
  const normalized = [...relativePaths]
    .sort()
    .map((relativePath) => `${relativePath}\n${normalizedFileContent(relativePath)}\n`)
    .join("---FILE---\n");
  return sha256(normalized);
}

function routeFiles() {
  return fs
    .readdirSync(path.join(projectRoot, "routes"))
    .filter((name) => name.endsWith(".js"))
    .sort()
    .map((name) => `routes/${name}`);
}

function controllerFiles() {
  return fs
    .readdirSync(path.join(projectRoot, "controller"))
    .filter((name) => name.endsWith(".js"))
    .sort()
    .map((name) => `controller/${name}`);
}

export function extractExecutableRoutes() {
  const routes = [];

  for (const relativePath of routeFiles()) {
    const source = normalizedFileContent(relativePath);

    for (const match of source.matchAll(/router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g)) {
      routes.push({ method: match[1].toUpperCase(), path: match[2] });
    }

    for (const match of source.matchAll(/router\.route\(\s*["']([^"']+)["']\s*\)(.*?);/gs)) {
      const routePath = match[1];
      const chain = match[2];
      for (const methodMatch of chain.matchAll(/\.(get|post|put|patch|delete)\s*\(/g)) {
        routes.push({ method: methodMatch[1].toUpperCase(), path: routePath });
      }
    }
  }

  const appSource = normalizedFileContent("app.js");
  for (const match of appSource.matchAll(/app\.(get|post|put|patch|delete)\(\s*["']\/api\/v1([^"']*)["']/g)) {
    routes.push({ method: match[1].toUpperCase(), path: match[2] || "/" });
  }

  // Swagger UI is mounted with app.use(), but the externally documented entry point is GET /docs.
  if (/app\.use\(\s*["']\/api\/v1\/docs["']/.test(appSource)) {
    routes.push({ method: "GET", path: "/docs" });
  }

  const unique = new Map();
  for (const route of routes) unique.set(`${route.method} ${route.path}`, route);
  return [...unique.values()].sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));
}

export function contractKeys(contract) {
  return canonicalContract(contract).map((route) => `${route.method} ${route.path}`);
}

export function executableRouteKeys() {
  return extractExecutableRoutes().map((route) => `${route.method} ${route.path}`);
}

export function openApiKeys(openapi) {
  const supported = new Set(["get", "post", "put", "patch", "delete"]);
  const keys = [];
  for (const [openApiPath, methods] of Object.entries(openapi.paths || {})) {
    const expressPath = openApiPath.replace(/\{([A-Za-z0-9_]+)\}/g, ":$1");
    for (const method of Object.keys(methods)) {
      if (supported.has(method)) keys.push(`${method.toUpperCase()} ${expressPath}`);
    }
  }
  return keys.sort();
}

export function buildFreezeSnapshot({ contract, appVersion, apiVersion, openapi }) {
  const routes = canonicalContract(contract);
  const requestSurfaceFiles = [
    "validators/schemas.js",
    "middleware/validate.js",
    ...routeFiles(),
    ...controllerFiles(),
  ];
  const responseSurfaceFiles = [
    "app.js",
    ...controllerFiles(),
    "middleware/error.js",
    "middleware/notFound.js",
    "utils/handleError.js",
  ];

  return {
    appVersion,
    apiVersion,
    contractEntries: routes.length,
    executableRoutes: extractExecutableRoutes().length,
    routeContractHash: sha256(JSON.stringify(routes)),
    requestSurfaceHash: hashFiles(requestSurfaceFiles),
    responseSurfaceHash: hashFiles(responseSurfaceFiles),
    openApiSurfaceHash: sha256(JSON.stringify(openApiKeys(openapi))),
  };
}
