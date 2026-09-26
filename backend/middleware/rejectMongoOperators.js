const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function containsUnsafeMongoKey(value) {
  if (Array.isArray(value)) return value.some(containsUnsafeMongoKey);
  if (!value || typeof value !== "object") return false;

  return Object.entries(value).some(([key, child]) => {
    if (key.startsWith("$") || BLOCKED_KEYS.has(key)) return true;
    return containsUnsafeMongoKey(child);
  });
}

export default function rejectMongoOperators(req, res, next) {
  if (containsUnsafeMongoKey(req.body) || containsUnsafeMongoKey(req.query)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request parameters",
      requestId: req.id,
    });
  }
  next();
}
