import test from "node:test";
import assert from "node:assert/strict";
import { couponSchema, couponUpdateSchema } from "../validators/schemas.js";

test("coupon update schema can be created and accepts partial updates", () => {
  const result = couponUpdateSchema.safeParse({ active: false });
  assert.equal(result.success, true);
});

test("percent coupons reject values above 100", () => {
  const result = couponSchema.safeParse({
    code: "SAVE150",
    type: "percent",
    value: 150,
    expiresAt: new Date(Date.now() + 86400000),
  });
  assert.equal(result.success, false);
});

test("partial percent coupon update rejects value above 100 when type is included", () => {
  const result = couponUpdateSchema.safeParse({ type: "percent", value: 150 });
  assert.equal(result.success, false);
});
