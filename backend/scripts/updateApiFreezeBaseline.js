import fs from "node:fs";
import path from "node:path";
import { APP_VERSION, API_VERSION, API_CONTRACT_REVISION } from "../config/version.js";
import { openapi } from "../docs/openapi.js";
import { buildFreezeSnapshot, projectRoot, readJson } from "./apiFreezeUtils.js";

const args = process.argv.slice(2);
function argValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const revision = Number(argValue("--revision"));
const reason = argValue("--reason")?.trim();
const manifestPath = path.join(projectRoot, "docs/api-freeze-manifest.json");
const current = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : null;

if (!Number.isInteger(revision) || revision < 1) {
  console.error("Provide an integer revision: --revision <number>.");
  process.exit(1);
}
if (revision !== API_CONTRACT_REVISION) {
  console.error(`--revision ${revision} must match API_CONTRACT_REVISION ${API_CONTRACT_REVISION}. Change config/version.js deliberately first.`);
  process.exit(1);
}
if (current && revision <= Number(current.contractRevision || 0)) {
  console.error(`Revision must be greater than the current revision ${current.contractRevision}.`);
  process.exit(1);
}
if (!reason || reason.length < 8) {
  console.error('Provide a meaningful reason: --reason "<why the API baseline changed>".');
  process.exit(1);
}

const contract = readJson("docs/api-contract.json");
const snapshot = buildFreezeSnapshot({ contract, appVersion: APP_VERSION, apiVersion: API_VERSION, openapi });
const next = {
  contractRevision: revision,
  changeReason: reason,
  frozenAt: new Date().toISOString(),
  ...snapshot,
};
fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`API freeze baseline updated to revision ${revision}. Review and commit docs/api-freeze-manifest.json deliberately.`);
