import { rateLimit } from "express-rate-limit";

function handler(message) {
  return (req, res, next, options) => {
    res.status(options.statusCode).json({ success: false, message, requestId: req.id });
  };
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler("Too many requests. Please try again later."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: handler("Too many authentication attempts. Please try again later."),
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler("Too many password reset requests. Please try again later."),
});
