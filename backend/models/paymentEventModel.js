import mongoose from "mongoose";

const paymentEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  eventType: { type: String, required: true, index: true },
  paymentId: { type: String, index: true },
  orderId: { type: String, index: true },
  processed: { type: Boolean, default: false, index: true },
  attempts: { type: Number, default: 0, min: 0 },
  lastError: { type: String, default: "", maxlength: 1000 },
  processedAt: Date,
}, { timestamps: true });

paymentEventSchema.index({ processed: 1, createdAt: 1 });
export default mongoose.model("PaymentEvent", paymentEventSchema);
