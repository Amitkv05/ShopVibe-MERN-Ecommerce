import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1, max: 99 },
  variantSku: { type: String, trim: true, default: "" },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true, unique: true, index: true },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });

export default mongoose.model("Cart", cartSchema);
