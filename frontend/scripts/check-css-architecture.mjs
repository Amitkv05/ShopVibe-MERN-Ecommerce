import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const stylesDir = path.join(root, "src", "styles");
const allowedFiles = [
  "globals.css",
  "layout.css",
  "home.css",
  "product.css",
  "catalog.css",
  "cart.css",
  "checkout.css",
  "auth.css",
  "account.css",
  "not-found.css",
  "admin/index.css",
  "admin/admin.css",
  "admin/dashboard.css",
  "admin/analytics.css",
  "admin/products.css",
  "admin/categories.css",
  "admin/subcategories.css",
  "admin/banners.css",
  "admin/inventory.css",
  "admin/orders.css",
  "admin/customers.css",
  "admin/coupons.css",
  "admin/reviews.css",
  "admin/media.css",
  "admin/system.css",
];

const legacyFiles = [
  "reference-parity.css",
  "premium-v4.css",
  "premium-v5.css",
  "admin-premium-normal.css",
  "admin.css",
];

for (const file of allowedFiles) {
  if (!fs.existsSync(path.join(stylesDir, file))) {
    throw new Error(`Missing stylesheet: src/styles/${file}`);
  }
}

for (const file of legacyFiles) {
  if (fs.existsSync(path.join(stylesDir, file))) {
    throw new Error(`Legacy stylesheet must be removed: src/styles/${file}`);
  }
}

const normalizeSelector = (value) => value.replace(/\s+/g, " ").trim();
const selectorOwners = new Map();

for (const file of allowedFiles.filter((file) => !file.endsWith("/index.css"))) {
  const source = fs
    .readFileSync(path.join(stylesDir, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  for (const match of source.matchAll(/([^{}]+)\{/g)) {
    let selector = match[1].trim();
    if (!selector || selector.startsWith("@")) continue;
    if (/^(from|to|\d+(?:\.\d+)?%)$/i.test(selector)) continue;

    if (selector.includes(";")) selector = selector.slice(selector.lastIndexOf(";") + 1).trim();
    selector = normalizeSelector(selector);
    if (!selector || selector.startsWith("@")) continue;
    if (!/[.#]/.test(selector)) continue;

    const owner = selectorOwners.get(selector);
    if (owner && owner !== file) {
      throw new Error(`Selector is defined in multiple stylesheet files: ${selector} -> ${owner}, ${file}`);
    }
    selectorOwners.set(selector, file);
  }
}

console.log(
  `CSS architecture check passed: ${allowedFiles.length} professional stylesheets, ${selectorOwners.size} class/id selectors with single-file ownership.`,
);
