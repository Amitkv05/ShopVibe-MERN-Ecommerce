import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers.set-cookie",
      "req.body.password",
      "req.body.confirmPassword",
      "req.body.oldPassword",
      "req.body.newPassword",
      "req.body.razorpaySignature",
      "password",
      "token",
      "resetToken",
      "smtpPassword",
      "jwtSecret",
      "razorpayKeySecret",
      "cloudinaryApiSecret",
    ],
    censor: "[Redacted]",
  },
});
