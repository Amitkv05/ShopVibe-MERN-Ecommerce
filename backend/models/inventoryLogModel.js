import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.ObjectId, ref: "Product", required: true, index: true },
  variantSku: { type: String, trim: true, default: "" },
  delta: { type: Number, required: true },
  previousStock: { type: Number },
  newStock: { type: Number },
  reason: { type: String, required: true, trim: true, maxlength: 200 },
  referenceType: { type: String, enum: ["order", "admin", "refund", "rollback", "migration", "other"], default: "other" },
  referenceId: { type: mongoose.Schema.ObjectId },
  actor: { type: mongoose.Schema.ObjectId, ref: "User" },
}, { timestamps: true });

inventoryLogSchema.index({ product: 1, createdAt: -1 });
inventoryLogSchema.index({ referenceType: 1, referenceId: 1, createdAt: -1 });
export default mongoose.model("InventoryLog", inventoryLogSchema);
