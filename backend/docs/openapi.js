import { readFileSync } from "node:fs";
import { APP_NAME, APP_VERSION, API_VERSION, API_CONTRACT_REVISION } from "../config/version.js";

const contract = JSON.parse(
  readFileSync(new URL("./api-contract.json", import.meta.url), "utf8"),
);

function openApiPath(routePath) {
  return routePath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function pathParameters(routePath) {
  return [...routePath.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
}

const paths = {};
for (const route of contract) {
  const path = openApiPath(route.path);
  const method = route.method.toLowerCase();
  paths[path] ||= {};
  paths[path][method] = {
    tags: [route.area],
    summary: `${route.method} ${route.path}`,
    description: route.frontend
      ? `Production API route. Access: ${route.auth}. Browser/client coverage: yes.`
      : `Production external/server route. Access: ${route.auth}.`,
    ...(route.auth === "user" || route.auth === "admin"
      ? { security: [{ cookieAuth: [] }] }
      : {}),
    ...(pathParameters(route.path).length
      ? { parameters: pathParameters(route.path) }
      : {}),
    responses: {
      "200": { description: "Success" },
      "201": { description: "Created" },
      "400": { description: "Validation or business-rule error" },
      "401": { description: "Authentication required" },
      "403": { description: "Insufficient permissions" },
      "404": { description: "Resource or route not found" },
    },
  };
}

export const openapi = {
  openapi: "3.1.0",
  info: {
    title: APP_NAME,
    version: APP_VERSION,
    description: "Production-hardened MERN e-commerce backend API. Public paths are generated from the checked API contract and protected by the API-freeze baseline/change-control gate.",
  },
  servers: [{ url: `/api/${API_VERSION}` }],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "token" },
    },
  },
  tags: [...new Set(contract.map((route) => route.area))].map((name) => ({ name })),
  paths,
  "x-api-freeze": {
    state: "baseline-frozen",
    contractRevision: API_CONTRACT_REVISION,
    routeCount: contract.length,
    note: "Final release lock is confirmed after the deferred Razorpay/payment verification batch.",
  },
};
