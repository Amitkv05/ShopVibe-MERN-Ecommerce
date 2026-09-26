import dotenv from "dotenv";
import path from "node:path";
import { setServers } from "node:dns";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const localEnv = dotenv.config({
  path: process.env.ENV_FILE || path.join(__dirname, ".env"),
});

if (localEnv.error && !process.env.DB_URI) {
  dotenv.config();
}

/**
 * Optional DNS override.
 *
 * Useful on local/network environments where Node.js cannot resolve
 * MongoDB Atlas mongodb+srv SRV records using the system DNS.
 *
 * Example:
 * DNS_SERVERS=8.8.8.8,8.8.4.4
 *
 * If DNS_SERVERS is not configured, Node.js continues using the
 * operating system's normal DNS configuration.
 */
const customDnsServers = process.env.DNS_SERVERS?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (customDnsServers?.length) {
  try {
    setServers(customDnsServers);

    console.log(`Custom DNS servers enabled: ${customDnsServers.join(", ")}`);
  } catch (error) {
    console.error("Invalid DNS_SERVERS configuration:", error.message);

    process.exit(1);
  }
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

const { validateEnvironment } = await import("./config/env.js");

const { connectMongoDatabase, disconnectMongoDatabase } =
  await import("./config/db.js");

const { logger } = await import("./config/logger.js");

const { APP_VERSION } = await import("./config/version.js");

const { default: app } = await import("./app.js");

validateEnvironment();

await connectMongoDatabase();

const port = Number(process.env.PORT) || 8000;

const server = app.listen(port, () => {
  logger.info(
    {
      port,
      environment: process.env.NODE_ENV || "development",
      version: APP_VERSION,
    },
    "HTTP server started",
  );
});

server.requestTimeout = Number(process.env.HTTP_REQUEST_TIMEOUT_MS) || 30000;

server.headersTimeout = Number(process.env.HTTP_HEADERS_TIMEOUT_MS) || 35000;

server.keepAliveTimeout =
  Number(process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS) || 5000;

let shuttingDown = false;

async function shutdown(reason, error) {
  if (shuttingDown) return;

  shuttingDown = true;

  if (error) {
    logger.error({ err: error }, reason);
  } else {
    logger.info(reason);
  }

  server.close(async () => {
    try {
      await disconnectMongoDatabase();
    } finally {
      process.exit(error ? 1 : 0);
    }
  });

  setTimeout(
    () => {
      logger.error("Graceful shutdown timed out; forcing exit");

      process.exit(1);
    },
    Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10000,
  ).unref();
}

process.on("unhandledRejection", (error) =>
  shutdown("Unhandled promise rejection", error),
);

process.on("SIGTERM", () =>
  shutdown("SIGTERM received. Shutting down gracefully."),
);

process.on("SIGINT", () =>
  shutdown("SIGINT received. Shutting down gracefully."),
);
