import { getAllowedOrigins } from "../config/env.js";
import HandleError from "../utils/handleError.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default function originGuard(req, res, next) {
  if (process.env.NODE_ENV !== "production" || !unsafeMethods.has(req.method)) {
    return next();
  }

  const origin = req.get("origin");
  if (!origin) return next(); // Allows non-browser API clients.

  const normalizedOrigin = origin.replace(/\/$/, "");
  if (!getAllowedOrigins().includes(normalizedOrigin)) {
    return next(new HandleError("Request origin is not allowed", 403));
  }

  next();
}
