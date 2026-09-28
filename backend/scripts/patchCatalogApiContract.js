import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendRoot, "..");
const apply = process.argv.includes("--apply");

const additions = [
  { method: "GET", path: "/products/category/:category", area: "Products", auth: "public", frontend: true },
  { method: "GET", path: "/products/subcategory/:subcategory", area: "Products", auth: "public", frontend: true },
  { method: "GET", path: "/products/:id/related", area: "Products", auth: "public", frontend: true },
  { method: "GET", path: "/categories/tree", area: "Categories", auth: "public", frontend: true },
  { method: "GET", path: "/subcategories", area: "Subcategories", auth: "public", frontend: true },
  { method: "GET", path: "/admin/subcategories", area: "Admin Subcategories", auth: "admin", frontend: true },
  { method: "POST", path: "/admin/subcategories", area: "Admin Subcategories", auth: "admin", frontend: true },
  { method: "PUT", path: "/admin/subcategories/:id", area: "Admin Subcategories", auth: "admin", frontend: true },
  { method: "DELETE", path: "/admin/subcategories/:id", area: "Admin Subcategories", auth: "admin", frontend: true },
];

const backendContractPath = path.join(backendRoot, "docs", "api-contract.json");
if (!fs.existsSync(backendContractPath)) {
  throw new Error(`API contract not found: ${backendContractPath}`);
}

const contract = JSON.parse(fs.readFileSync(backendContractPath, "utf8"));
const existing = new Set(contract.map((entry) => `${entry.method.toUpperCase()} ${entry.path}`));
const missing = additions.filter((entry) => !existing.has(`${entry.method} ${entry.path}`));
const next = [...contract, ...missing];

console.log(`Current contract entries: ${contract.length}`);
console.log(`Catalog routes to add: ${missing.length}`);
for (const route of missing) console.log(`  + ${route.method} ${route.path}`);
console.log(`Resulting contract entries: ${next.length}`);

if (!apply) {
  console.log("Dry run only. Re-run with --apply after reviewing the route additions.");
  process.exit(0);
}

const text = `${JSON.stringify(next, null, 2)}\n`;
fs.writeFileSync(backendContractPath, text);

const mirrors = [
  path.join(repoRoot, "shared", "api-contract.json"),
  path.join(repoRoot, "frontend", "src", "lib", "api-contract.json"),
];
for (const mirror of mirrors) {
  if (fs.existsSync(mirror)) {
    fs.writeFileSync(mirror, text);
    console.log(`Synced: ${path.relative(repoRoot, mirror)}`);
  }
}

console.log("API contract patched. Next: increment API_CONTRACT_REVISION and run api:freeze:update with a change reason.");
