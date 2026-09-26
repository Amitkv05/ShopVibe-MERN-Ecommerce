import { normalizeTransactionMode } from "./databaseCapabilities.js";

const required = ["DB_URI", "JWT_SECRET_KEY", "CLIENT_URL"];

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateEnvironment() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  normalizeTransactionMode(process.env.MONGO_TRANSACTIONS);

  const origins = getAllowedOrigins();
  if (!origins.length || origins.some((origin) => !validHttpUrl(origin))) {
    throw new Error(
      "CLIENT_URL/CLIENT_URLS must contain valid http(s) origins",
    );
  }

  if ((process.env.JWT_SECRET_KEY?.length ?? 0) < 32) {
    const message = "JWT_SECRET_KEY should be at least 32 characters";
    if (process.env.NODE_ENV === "production") throw new Error(message);
    console.warn(`Warning: ${message}`);
  }

  if (process.env.NODE_ENV === "production") {
    const insecureOrigins = origins.filter(
      (origin) =>
        origin.startsWith("http://") &&
        !origin.includes("localhost") &&
        !origin.includes("127.0.0.1"),
    );
    if (insecureOrigins.length)
      throw new Error("Production CLIENT_URL/CLIENT_URLS must use HTTPS");
  }
}

export function getAllowedOrigins() {
  const values = [process.env.CLIENT_URL, process.env.CLIENT_URLS]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return [...new Set(values)];
}
