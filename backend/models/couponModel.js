import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  type: { type: String, enum: ["percent", "fixed"], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  maxDiscountAmount: { type: Number, min: 0 },
  usageLimit: { type: Number, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  perUserLimit: { type: Number, default: 1, min: 1 },
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

couponSchema.index({ active: 1, startsAt: 1, expiresAt: 1 });
export default mongoose.model("Coupon", couponSchema);
