import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const required = ["index.html","vite.config.js","src/main.jsx","src/App.jsx","src/components/AppShell.jsx","src/components/reusable/ThemeProvider.jsx","src/components/reusable/ThemeToggle.jsx","src/styles/globals.css"];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) { console.error("Missing Vite/React files:", missing); process.exit(1); }
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
