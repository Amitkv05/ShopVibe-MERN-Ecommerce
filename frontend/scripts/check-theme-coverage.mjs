import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const failures = [];
const themeProvider = read("src/components/reusable/ThemeProvider.jsx");
const globals = read("src/styles/globals.css");

for (const token of [
  'root.classList.toggle("dark"',
  "root.dataset.theme = theme",
  "shopvibe_theme",
]) {
  if (!themeProvider.includes(token)) failures.push(`ThemeProvider missing: ${token}`);
}

for (const token of [
  ":root.dark",
  "--app-bg: #101113",
  "--app-surface: #17181b",
  "--app-text: #f7f7f8",
  ".dark .bg-white",
  ".dark .text-gray-900",
  ".dark .border-gray-200",
  ".dark input",
]) {
  if (!globals.includes(token)) failures.push(`Global dark bridge missing: ${token}`);
}

const customerStyles = [
  "layout.css",
  "home.css",
  "product.css",
  "catalog.css",
  "cart.css",
  "checkout.css",
  "account.css",
  "not-found.css",
];

for (const file of customerStyles) {
  const source = read(`src/styles/${file}`);
  const themeAware = source.includes("var(--app-") || source.includes(".dark ");
  if (!themeAware) failures.push(`Customer stylesheet is not theme-aware: ${file}`);
}

const adminDir = path.join(root, "src", "styles", "admin");
for (const file of fs.readdirSync(adminDir).filter((name) => name.endsWith(".css") && name !== "index.css")) {
  const source = fs.readFileSync(path.join(adminDir, file), "utf8");
  const visualFile = /background|color|border/i.test(source);
  if (!visualFile) continue;
  const themeAware = source.includes("var(--app-") || source.includes(".dark ") || file === "admin.css";
  if (!themeAware) failures.push(`Admin stylesheet is not theme-aware: admin/${file}`);
}

const screenFiles = [
  ...fs.readdirSync(path.join(root, "src", "screens")).filter((name) => name.endsWith(".jsx")),
  ...fs.readdirSync(path.join(root, "src", "components", "admin")).filter((name) => name.endsWith(".jsx")),
];

const forbiddenInline = [
  /background\s*:\s*["']#fff/i,
  /background\s*:\s*["']white["']/i,
  /color\s*:\s*["']#(?:111|222|000)/i,
];
for (const group of ["src/screens", "src/components/admin", "src/components/layout"]) {
  const dir = path.join(root, group);
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".jsx"))) {
    const source = fs.readFileSync(path.join(dir, file), "utf8");
    for (const pattern of forbiddenInline) {
      if (pattern.test(source)) failures.push(`Theme-hostile inline color in ${group}/${file}: ${pattern}`);
    }
  }
}

if (failures.length) {
  console.error("Theme coverage check FAILED:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Theme coverage check passed: ${screenFiles.length} customer/admin screen modules plus shared layout/reusable theme bridges verified.`);
