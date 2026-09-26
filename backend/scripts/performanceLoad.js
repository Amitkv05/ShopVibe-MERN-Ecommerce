const baseUrl = String(process.env.PERF_BASE_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
const concurrency = Math.max(1, Math.min(Number.parseInt(process.env.PERF_CONCURRENCY || "10", 10) || 10, 100));
const requestsPerScenario = Math.max(1, Math.min(Number.parseInt(process.env.PERF_REQUESTS || "50", 10) || 50, 5000));
const keyword = encodeURIComponent(process.env.PERF_SEARCH_KEYWORD || "test");

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

async function runScenario(name, requestFactory, total = requestsPerScenario) {
  const latencies = [];
  const statusCounts = new Map();
  let failures = 0;
  let nextIndex = 0;
  const startedAt = performance.now();

  async function worker() {
    while (true) {
      const current = nextIndex++;
      if (current >= total) return;
      const started = performance.now();
      try {
        const response = await requestFactory(current);
        const elapsed = performance.now() - started;
        latencies.push(elapsed);
        statusCounts.set(response.status, (statusCounts.get(response.status) || 0) + 1);
        if (!response.ok) failures += 1;
        await response.arrayBuffer();
      } catch (error) {
        failures += 1;
        latencies.push(performance.now() - started);
        statusCounts.set("network-error", (statusCounts.get("network-error") || 0) + 1);
        if (process.env.PERF_VERBOSE === "true") console.error(name, error.message);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));
  const durationMs = performance.now() - startedAt;
  const sorted = [...latencies].sort((a, b) => a - b);
  const summary = {
    scenario: name,
    requests: total,
    concurrency: Math.min(concurrency, total),
    durationMs: Math.round(durationMs),
    requestsPerSecond: Math.round((total / Math.max(durationMs / 1000, 0.001)) * 100) / 100,
    failures,
    errorRatePercent: Math.round((failures / total) * 10000) / 100,
    latencyMs: {
      min: Math.round((sorted[0] || 0) * 100) / 100,
      p50: Math.round(percentile(sorted, 50) * 100) / 100,
      p95: Math.round(percentile(sorted, 95) * 100) / 100,
      max: Math.round((sorted.at(-1) || 0) * 100) / 100,
    },
    statuses: Object.fromEntries(statusCounts),
  };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

async function main() {
  console.log(`Performance target: ${baseUrl}`);
  console.log(`Concurrency: ${concurrency}; requests/scenario: ${requestsPerScenario}`);

  await runScenario("product-list", () => fetch(`${baseUrl}/products?page=1&limit=12`));
  await runScenario("product-search", () => fetch(`${baseUrl}/products?keyword=${keyword}&page=1&limit=12`));

  const email = process.env.PERF_EMAIL;
  const password = process.env.PERF_PASSWORD;
  if (email && password) {
    await runScenario("login", () => fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }), Math.min(requestsPerScenario, 100));
  } else {
    console.log("Skipping login load test: set PERF_EMAIL and PERF_PASSWORD locally for a disposable test user.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
