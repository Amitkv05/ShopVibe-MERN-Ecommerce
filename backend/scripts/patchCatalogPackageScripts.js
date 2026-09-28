import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const packagePath = path.join(backendRoot, "package.json");
const apply = process.argv.includes("--apply");

const additions = {
  "migrate:catalog:dry": "node scripts/importLegacyCatalog.js",
  "migrate:catalog": "node scripts/importLegacyCatalog.js --apply",
  "migrate:catalog:overwrite": "node scripts/importLegacyCatalog.js --apply --overwrite-existing",
  "migrate:catalog:banners": "node scripts/importLegacyCatalog.js --apply --with-banners",
  "catalog:contract:dry": "node scripts/patchCatalogApiContract.js",
  "catalog:contract": "node scripts/patchCatalogApiContract.js --apply",
};

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.scripts ||= {};
const changes = [];
for (const [name, command] of Object.entries(additions)) {
  if (pkg.scripts[name] !== command) changes.push({ name, old: pkg.scripts[name], next: command });
}

console.log(`Package scripts to add/update: ${changes.length}`);
for (const change of changes) console.log(`  ${change.name} -> ${change.next}`);

if (!apply) {
  console.log("Dry run only. Re-run with --apply to update backend/package.json.");
  process.exit(0);
}

Object.assign(pkg.scripts, additions);
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log("backend/package.json catalog scripts updated.");
