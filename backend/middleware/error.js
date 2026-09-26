import HandleError from "../utils/handleError.js";
import { logger } from "../config/logger.js";

export default (err, req, res, next) => {
  let error = err;


  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      error = new HandleError("Image size cannot exceed 5 MB", 413);
    } else if (err.code === "LIMIT_FILE_COUNT") {
      error = new HandleError("Too many uploaded files", 400);
    } else {
      error = new HandleError("Invalid file upload", 400);
    }
  }

  if (err?.type === "entity.too.large" || err?.status === 413) {
    error = new HandleError("Request body is too large", 413);
  }

  if (err instanceof SyntaxError && err?.status === 400 && "body" in err) {
    error = new HandleError("Invalid JSON payload", 400);
  }

  if (err?.name === "CastError") {
    error = new HandleError(`Resource not found. Invalid ${err.path}`, 404);
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "value";
    error = new HandleError(`${field} already exists`, 409);
  }

  if (err?.name === "ValidationError") {
    const details = Object.values(err.errors ?? {}).map((item) => item.message);
    error = new HandleError("Validation failed", 400, details);
  }

  if (err?.name === "JsonWebTokenError") {
    error = new HandleError("Invalid authentication token", 401);
  }

  if (err?.name === "TokenExpiredError") {
    error = new HandleError("Authentication token has expired", 401);
  }

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    logger.error({ err, requestId: req.id, method: req.method, path: req.originalUrl }, "Unhandled request error");
  } else if (statusCode >= 400) {
    logger.warn({ requestId: req.id, method: req.method, path: req.originalUrl, statusCode, message: error.message }, "Request rejected");
  }

  const response = {
    success: false,
    message:
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "Internal Server Error"
        : error.message || "Internal Server Error",
    requestId: req.id,
  };

  if (error.details) response.details = error.details;
  if (process.env.NODE_ENV !== "production" && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};
