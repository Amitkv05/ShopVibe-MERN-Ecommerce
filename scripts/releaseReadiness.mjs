import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  '.github/workflows/ci.yml',
  'backend/.env.example',
  'frontend/.env.example',
  'backend/Dockerfile',
  'frontend/Dockerfile',
  'docs/DEPLOYMENT.md',
  'docs/ENVIRONMENT_VARIABLES.md',
  'docs/API_GUIDE.md',
  'docs/ADMIN_GUIDE.md',
  'docs/BACKUP_RESTORE.md',
  'docs/KNOWN_LIMITATIONS.md',
  'docs/UAT_CHECKLIST.md',
  'docs/LAUNCH_RUNBOOK.md',
  'docs/POST_LAUNCH_RUNBOOK.md',
  'docs/MAINTENANCE_SUPPORT_TEMPLATE.md',
  'docs/EXTERNAL_INPUTS.md',
];

const missing = [];
for (const file of required) {
  try {
    await access(path.join(root, file));
  } catch {
    missing.push(file);
  }
}

if (missing.length) {
  console.error('Missing release files:', missing);
  process.exit(1);
}

const secretLikeFiles = [];

async function walk(dir, rel = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = path.join(rel, entry.name);

    if (
      entry.name === 'node_modules' ||
      entry.name === '.git' ||
      entry.name === 'dist'
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      await walk(path.join(dir, entry.name), relative);
      continue;
    }

    if (/^\.env(?:\s|$|\.)/.test(entry.name) && entry.name !== '.env.example') {
      secretLikeFiles.push(relative);
    }
  }
}

await walk(root);

// Local development legitimately uses .env files. Do not fail a developer's
// local readiness check merely because those ignored files exist. In CI/release
// packaging, however, their presence is a hard failure.
if (secretLikeFiles.length) {
  if (process.env.CI === 'true') {
    console.error('Forbidden env/secret-like files:', secretLikeFiles);
    process.exit(1);
  }

  console.warn(
    'Local env files detected (allowed for local development; they must remain gitignored and must not be shipped):',
    secretLikeFiles,
  );
}

const rootGitignore = await readFile(path.join(root, '.gitignore'), 'utf8');
for (const rule of ['.env*', '!.env.example', 'backend/.env*', 'frontend/.env*']) {
  if (!rootGitignore.split(/\r?\n/).includes(rule)) {
    throw new Error(`Root .gitignore missing required env rule: ${rule}`);
  }
}

const ci = await readFile(path.join(root, '.github/workflows/ci.yml'), 'utf8');
for (const token of [
  'npm install',
  'npm run check:contract',
  'npm run check:backend',
  'npm run check:integration',
  'npm test',
  'npm run build',
  'npm audit',
]) {
  if (!ci.includes(token)) throw new Error(`CI missing: ${token}`);
}

const env = await readFile(path.join(root, 'backend/.env.example'), 'utf8');
for (const token of [
  'DB_URI=',
  'JWT_SECRET_KEY=',
  'CLIENT_URL=',
  'SMTP_PASSWORD=',
  'CLOUDINARY_API_SECRET=',
  'RAZORPAY_KEY_SECRET=',
]) {
  if (!env.includes(token)) throw new Error(`Env guide missing ${token}`);
}

console.log(
  `Release readiness static gate passed: ${required.length} required files, secret-file policy, CI stages and environment template verified.`,
);
