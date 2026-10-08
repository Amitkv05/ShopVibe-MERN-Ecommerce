import Coupon from "../models/couponModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import { buildOrderQuote } from "../services/cartService.js";
import { couponSchema } from "../validators/schemas.js";

export const listCoupons = handleAsyncError(async (req, res) => {
  const coupons = await Coupon.find().sort("-createdAt");
  res.json({ success: true, coupons });
});
export const createCoupon = handleAsyncError(async (req, res) => {
  const coupon = await Coupon.create({
    ...req.body,
    code: req.body.code.toUpperCase(),
  });
  res.status(201).json({ success: true, coupon });
});
export const updateCoupon = handleAsyncError(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return next(new HandleError("Coupon not found", 404));

  const updates = { ...req.body };
  if (updates.code) updates.code = updates.code.toUpperCase();

  // Validate the complete post-update coupon, not just the partial payload.
  // This catches cases such as changing a fixed coupon with value 500 into
  // a percent coupon without also sending a new value.
  const mergedCoupon = {
    code: updates.code ?? coupon.code,
    description: updates.description ?? coupon.description,
    type: updates.type ?? coupon.type,
    value: updates.value ?? coupon.value,
    minOrderAmount: updates.minOrderAmount ?? coupon.minOrderAmount,
    maxDiscountAmount: updates.maxDiscountAmount ?? coupon.maxDiscountAmount,
    usageLimit: updates.usageLimit ?? coupon.usageLimit,
    perUserLimit: updates.perUserLimit ?? coupon.perUserLimit,
    startsAt: updates.startsAt ?? coupon.startsAt,
    expiresAt: updates.expiresAt ?? coupon.expiresAt,
    active: updates.active ?? coupon.active,
  };

  const finalValidation = couponSchema.safeParse(mergedCoupon);
  if (!finalValidation.success) {
    const details = finalValidation.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return next(new HandleError("Validation failed", 400, details));
  }

  Object.assign(coupon, updates);
  await coupon.save();
  res.json({ success: true, coupon });
});
export const deleteCoupon = handleAsyncError(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new HandleError("Coupon not found", 404));
  res.json({ success: true, message: "Coupon deleted" });
});
export const validateCoupon = handleAsyncError(async (req, res) => {
  const quote = await buildOrderQuote(req.body.orderItems, {
    couponCode: req.body.couponCode,
    userId: req.user._id,
  });
  res.json({
    success: true,
    couponCode: quote.couponCode,
    discountPrice: quote.discountPrice,
    totalPrice: quote.totalPrice,
    currency: quote.currency,
  });
});
