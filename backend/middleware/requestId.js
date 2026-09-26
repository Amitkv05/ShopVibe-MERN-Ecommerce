import crypto from "node:crypto";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,100}$/;

export default function requestId(req, res, next) {
  const incoming = String(req.get("x-request-id") || "").trim();
  req.id = SAFE_REQUEST_ID.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
}
