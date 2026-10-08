import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const required = [
  "index.html",
  "vite.config.js",
  "src/main.jsx",
  "src/App.jsx",
  "src/components/AppShell.jsx",
  "src/components/reusable/ThemeProvider.jsx",
  "src/components/reusable/ThemeToggle.jsx",
  "src/styles/globals.css",
  "src/styles/layout.css",
  "src/styles/home.css",
  "src/styles/product.css",
  "src/styles/catalog.css",
  "src/styles/cart.css",
  "src/styles/checkout.css",
  "src/styles/auth.css",
  "src/styles/account.css",
  "src/styles/not-found.css",
  "src/styles/admin/index.css",
  "src/styles/admin/admin.css",
  "src/styles/admin/dashboard.css",
  "src/styles/admin/analytics.css",
  "src/styles/admin/products.css",
  "src/styles/admin/categories.css",
  "src/styles/admin/subcategories.css",
  "src/styles/admin/banners.css",
  "src/styles/admin/inventory.css",
  "src/styles/admin/orders.css",
  "src/styles/admin/customers.css",
  "src/styles/admin/coupons.css",
  "src/styles/admin/reviews.css",
  "src/styles/admin/media.css",
  "src/styles/admin/system.css",
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) { console.error("Missing Vite/React files:", missing); process.exit(1); }

const legacyStyleFiles = [
  "src/styles/reference-parity.css",
  "src/styles/premium-v4.css",
  "src/styles/premium-v5.css",
  "src/styles/admin-premium-normal.css",
];
const legacyStylesPresent = legacyStyleFiles.filter((file) => fs.existsSync(path.join(root, file)));
if (legacyStylesPresent.length) {
  console.error("Legacy CSS files must be removed after the stylesheet refactor:", legacyStylesPresent);
  process.exit(1);
}

const mainSource = fs.readFileSync(path.join(root, "src/main.jsx"), "utf8");
for (const styleFile of required.filter((file) => file.startsWith("src/styles/") && (!file.startsWith("src/styles/admin/") || file.endsWith("/index.css")))) {
  const importPath = `./${styleFile.replace(/^src\//, "")}`;
  if (!mainSource.includes(`import "${importPath}"`)) {
    throw new Error(`main.jsx is missing stylesheet import: ${importPath}`);
  }
}
const allFiles = fs.readdirSync(root, { recursive: true }).filter((entry) => typeof entry === "string");
const sourceFiles = allFiles.filter((file) => file.startsWith(`src${path.sep}`) || file.startsWith("src/"));
const typedFiles = sourceFiles.filter((file) => /\.(ts|tsx)$/.test(file));
if (typedFiles.length) { console.error("TypeScript files are not allowed:", typedFiles); process.exit(1); }
const forbiddenFiles = allFiles.filter((file) => /(^|[\\/])next\.config\.|(^|[\\/])tsconfig\.json$|(^|[\\/])src[\\/]app([\\/]|$)/.test(file));
if (forbiddenFiles.length) { console.error("Next.js/TypeScript framework files are not allowed:", forbiddenFiles); process.exit(1); }
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
for (const name of ["next","typescript","eslint-config-next","@types/react","@types/react-dom","@types/node"]) if (deps[name]) throw new Error(`Forbidden dependency found: ${name}`);
for (const name of ["react","react-dom","vite","@vitejs/plugin-react"]) if (!deps[name]) throw new Error(`Required React/Vite dependency missing: ${name}`);
const api = fs.readFileSync(path.join(root, "src/lib/api.js"), "utf8");
if (!api.includes("import.meta.env.VITE_API_URL")) throw new Error("API client is not using VITE_API_URL");
const theme = fs.readFileSync(path.join(root, "src/components/reusable/ThemeProvider.jsx"), "utf8");
if (!theme.includes("shopvibe_theme")) throw new Error("Theme persistence is missing");
console.log(`Pure React/Vite structure passed: ${sourceFiles.length} source files, 0 TypeScript files, no Next.js dependencies.`);
