const base = (process.env.STAGING_API_BASE_URL || '').replace(/\/$/, '');
if (!base) {
  console.error('Set STAGING_API_BASE_URL, e.g. https://api-staging.example.com/api/v1');
  process.exit(2);
}
const checks = [
  ['/health', 200], ['/health/live', 200], ['/health/ready', 200],
  ['/openapi.json', 200], ['/products?limit=1', 200], ['/categories', 200]
];
let failed = 0;
for (const [path, expected] of checks) {
  try {
    const res = await fetch(`${base}${path}`, {headers: {'Accept':'application/json'}});
    const ok = res.status === expected;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${res.status} ${path}`);
    if (!ok) failed++;
  } catch (error) {
    console.log(`FAIL ${path}: ${error.message}`); failed++;
  }
}
process.exitCode = failed ? 1 : 0;
