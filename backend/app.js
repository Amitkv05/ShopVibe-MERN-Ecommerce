import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import pinoHttp from "pino-http";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import errorHandleMiddleware from "./middleware/error.js";
import notFound from "./middleware/notFound.js";
import originGuard from "./middleware/originGuard.js";
import requestId from "./middleware/requestId.js";
import rejectMongoOperators from "./middleware/rejectMongoOperators.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { getAllowedOrigins } from "./config/env.js";
import { razorpayWebhook } from "./controller/paymentController.js";
import { logger } from "./config/logger.js";
import { openapi } from "./docs/openapi.js";
import { APP_VERSION, API_VERSION } from "./config/version.js";
import { getDatabaseCapabilities } from "./config/databaseCapabilities.js";

const app = express();
app.disable("x-powered-by");
app.set("query parser", "extended");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(requestId);
app.use((req, res, next) => {
  res.setHeader("X-API-Version", APP_VERSION);
  next();
});

const allowedOrigins = getAllowedOrigins();
app.use(cors({ credentials: true, origin(origin, cb) {
  if (!origin) return cb(null, true);
  const normalized = origin.replace(/\/$/, "");
  if (allowedOrigins.includes(normalized)) return cb(null, true);
  const error = new Error("CORS origin not allowed"); error.statusCode = 403; return cb(error);
} }));
app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false }));
app.use(compression());
app.use(pinoHttp({
  logger,
  autoLogging: process.env.NODE_ENV !== "test",
  genReqId: (req) => req.id,
  redact: ["req.headers.authorization", "req.headers.cookie", "res.headers.set-cookie"],
}));

// Razorpay requires the exact raw request body for signature verification.
app.post("/api/v1/payment/webhook", express.raw({ type: "application/json", limit: "256kb" }), razorpayWebhook);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(cookieParser());
app.use(rejectMongoOperators);
app.use(hpp());
app.use(apiLimiter);
app.use(originGuard);

app.get("/api/v1/health/live", (req, res) => res.status(200).json({ success: true, status: "live", version: APP_VERSION, apiVersion: API_VERSION, requestId: req.id }));
app.get("/api/v1/health", (req, res) => res.status(200).json({ success: true, status: "ok", version: APP_VERSION, uptimeSeconds: Math.floor(process.uptime()), requestId: req.id }));
app.get("/api/v1/health/ready", async (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  let pingOk = false;
  if (connected) {
    try { await mongoose.connection.db.admin().command({ ping: 1 }); pingOk = true; } catch { pingOk = false; }
  }
  const ready = connected && pingOk;
  const capabilities = getDatabaseCapabilities();
  res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? "ready" : "not-ready",
    database: ready ? "connected" : "disconnected",
    topology: capabilities.topology,
    transactionsEnabled: capabilities.transactionsEnabled,
    requestId: req.id,
  });
});

app.get("/api/v1/openapi.json", (req, res) => res.json(openapi));
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

for (const routes of [productRoutes, userRoutes, orderRoutes, paymentRoutes, categoryRoutes, couponRoutes, cartRoutes, wishlistRoutes, addressRoutes, adminRoutes, bannerRoutes]) {
  app.use("/api/v1", routes);
}
app.use(notFound);
app.use(errorHandleMiddleware);
export default app;
