const defaultCapabilities = Object.freeze({
  checked: false,
  topology: "unknown",
  transactionsSupported: false,
  logicalSessionTimeoutMinutes: null,
  setName: null,
  transactionMode: "auto",
  transactionsEnabled: false,
  reason: "Database capabilities have not been checked yet",
});

let capabilities = { ...defaultCapabilities };

export function parseMongoHello(hello = {}) {
  const topology = hello.msg === "isdbgrid"
    ? "mongos"
    : hello.setName
      ? "replicaSet"
      : "standalone";
  const logicalSessionTimeoutMinutes = Number.isFinite(hello.logicalSessionTimeoutMinutes)
    ? hello.logicalSessionTimeoutMinutes
    : null;
  const transactionsSupported = topology === "mongos" || topology === "replicaSet";
  return {
    topology,
    transactionsSupported,
    logicalSessionTimeoutMinutes,
    setName: hello.setName || null,
  };
}

export function normalizeTransactionMode(value = process.env.MONGO_TRANSACTIONS) {
  const mode = String(value ?? "auto").trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(mode)) return "true";
  if (["false", "0", "no", "off"].includes(mode)) return "false";
  if (["auto", ""].includes(mode)) return "auto";
  throw new Error("MONGO_TRANSACTIONS must be auto, true, or false");
}

export function resolveTransactionPolicy({ mode, transactionsSupported }) {
  const normalizedMode = normalizeTransactionMode(mode);
  if (normalizedMode === "false") {
    return {
      transactionMode: normalizedMode,
      transactionsEnabled: false,
      reason: "Transactions disabled by MONGO_TRANSACTIONS=false",
    };
  }
  if (normalizedMode === "true" && !transactionsSupported) {
    throw new Error(
      "MONGO_TRANSACTIONS=true but the connected MongoDB deployment is standalone. Use MONGO_TRANSACTIONS=auto/false locally, or connect to MongoDB Atlas/a replica set.",
    );
  }
  const transactionsEnabled = transactionsSupported;
  return {
    transactionMode: normalizedMode,
    transactionsEnabled,
    reason: transactionsEnabled
      ? "MongoDB deployment supports transactions"
      : "Standalone MongoDB detected; using compensated non-transaction checkout",
  };
}

export async function detectDatabaseCapabilities(connection) {
  const hello = await connection.db.admin().command({ hello: 1 });
  const detected = parseMongoHello(hello);
  const policy = resolveTransactionPolicy({
    mode: process.env.MONGO_TRANSACTIONS,
    transactionsSupported: detected.transactionsSupported,
  });
  capabilities = {
    checked: true,
    ...detected,
    ...policy,
  };
  return getDatabaseCapabilities();
}

export function getDatabaseCapabilities() {
  return { ...capabilities };
}

export function resetDatabaseCapabilitiesForTests() {
  capabilities = { ...defaultCapabilities };
}
