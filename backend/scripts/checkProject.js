import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", ".git"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}
const files = await walk(process.cwd());
let failed = false;
for (const file of files) {
  const r = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (r.status !== 0) { failed = true; console.error(r.stderr || `Syntax error: ${file}`); }
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    let target = path.resolve(path.dirname(file), match[1]);
    if (!path.extname(target)) target += ".js";
    try { await access(target); } catch { failed = true; console.error(`Missing import: ${file} -> ${match[1]}`); }
  }
}
if (failed) process.exit(1);
console.log(`Project check passed for ${files.length} JavaScript files.`);
