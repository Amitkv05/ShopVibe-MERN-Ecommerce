import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = JSON.parse(await readFile(path.join(root, 'shared/api-contract.json'), 'utf8'));
const frontendContract = JSON.parse(await readFile(path.join(root, 'frontend/src/lib/api-contract.json'), 'utf8'));
const backendDocsContract = JSON.parse(await readFile(path.join(root, 'backend/docs/api-contract.json'), 'utf8'));
const key = (r) => `${r.method.toUpperCase()} ${r.path}`;
const normalize = (p) => p.replace(/^\/api\/v1/, '') || '/';
const actual = new Set();

for (const name of await readdir(path.join(root, 'backend/routes'))) {
  if (!name.endsWith('.js')) continue;
  const src = await readFile(path.join(root, 'backend/routes', name), 'utf8');
  for (const m of src.matchAll(/router\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g)) actual.add(`${m[1].toUpperCase()} ${m[2]}`);
  for (const block of src.matchAll(/router\.route\(\s*["'`]([^"'`]+)["'`]\s*\)([\s\S]*?);/g)) {
    for (const mm of block[2].matchAll(/\.(get|post|put|patch|delete)\s*\(/g)) actual.add(`${mm[1].toUpperCase()} ${block[1]}`);
  }
}
const appSrc = await readFile(path.join(root, 'backend/app.js'), 'utf8');
for (const m of appSrc.matchAll(/app\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g)) {
  if (m[2].startsWith('/api/v1/')) actual.add(`${m[1].toUpperCase()} ${normalize(m[2])}`);
}
const sharedKeys = contract.map(key).sort();
for (const [label, copy] of [['frontend', frontendContract], ['backend docs', backendDocsContract]]) {
  if (JSON.stringify(sharedKeys) !== JSON.stringify(copy.map(key).sort())) throw new Error(`${label} API contract differs from shared/api-contract.json`);
}
const missing = contract.filter((r) => !r.special && !actual.has(key(r)));
const undocumented = [...actual].filter((k) => !sharedKeys.includes(k));
if (missing.length || undocumented.length) {
  console.error({missing: missing.map(key), undocumented});
  process.exit(1);
}
console.log(`API contract check passed: ${actual.size} executable routes, ${contract.length} contract entries.`);
