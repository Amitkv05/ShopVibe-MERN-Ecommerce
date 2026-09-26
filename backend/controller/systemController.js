import os from "node:os";
import mongoose from "mongoose";
import handleAsyncError from "../middleware/handleAsyncError.js";
import { getDatabaseCapabilities } from "../config/databaseCapabilities.js";
import { APP_NAME, APP_VERSION, API_VERSION } from "../config/version.js";

function featureFlags() {
  return {
    smtp: Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    razorpayWebhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    cloudinary: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
    emailVerificationRequired: String(process.env.REQUIRE_EMAIL_VERIFICATION || "false").toLowerCase() === "true",
  };
}

function runtimeMetrics() {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();
  const loadAverage = os.loadavg();

  return {
    node: process.version,
    pid: process.pid,
    uptimeSeconds: Math.floor(process.uptime()),
    startedAt: new Date(Date.now() - process.uptime() * 1000),
    memoryMb: {
      rss: Math.round(memory.rss / 1024 / 1024),
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      external: Math.round(memory.external / 1024 / 1024),
    },
    cpu: {
      userMs: Math.round(cpu.user / 1000),
      systemMs: Math.round(cpu.system / 1000),
      logicalCores: typeof os.availableParallelism === "function" ? os.availableParallelism() : os.cpus().length,
      loadAverage1m: Math.round((loadAverage[0] || 0) * 100) / 100,
      loadAverage5m: Math.round((loadAverage[1] || 0) * 100) / 100,
      loadAverage15m: Math.round((loadAverage[2] || 0) * 100) / 100,
    },
  };
}

export const systemStatus = handleAsyncError(async (req, res) => {
  const db = mongoose.connection;
  const capabilities = getDatabaseCapabilities();

  let pingMs = null;
  if (db.readyState === 1) {
    const started = performance.now();
    await db.db.admin().command({ ping: 1 });
    pingMs = Math.round((performance.now() - started) * 100) / 100;
  }

  res.json({
    success: true,
    app: { name: APP_NAME, version: APP_VERSION, apiVersion: API_VERSION, environment: process.env.NODE_ENV || "development" },
    runtime: runtimeMetrics(),
    database: {
      connected: db.readyState === 1,
      host: db.host || null,
      name: db.name || null,
      pingMs,
      ...capabilities,
    },
    features: featureFlags(),
    requestId: req.id,
  });
});
