import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: "" },
  product: { type: mongoose.Schema.ObjectId, ref: "Product", required: true },
  variantSku: { type: String, trim: true, default: "" },
  variantAttributes: { type: Map, of: String, default: {} },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  shippingInfo: {
    fullName: { type: String, trim: true, maxlength: 80 },
    address: { type: String, required: true, trim: true, maxlength: 250 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
    pinCode: { type: String, required: true, trim: true, maxlength: 20 },
    phoneNo: { type: String, required: true, trim: true, maxlength: 20 },
  },
  orderItems: { type: [orderItemSchema], validate: [(items) => items.length > 0, "Order must contain at least one item"] },
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true, index: true },
  paymentMethod: { type: String, enum: ["COD", "RAZORPAY"], default: "COD", required: true },
  paymentInfo: {
    id: String,
    orderId: String,
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  },
  paidAt: Date,
  itemsPrice: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, required: true, min: 0, default: 0 },
  couponCode: { type: String, uppercase: true, trim: true, default: "" },
  taxPrice: { type: Number, required: true, min: 0, default: 0 },
  shippingPrice: { type: Number, required: true, min: 0, default: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR", uppercase: true },
  orderStatus: { type: String, enum: ["Processing", "Shipped", "Delivered", "Cancelled"], default: "Processing", index: true },
  statusHistory: [{ status: { type: String, required: true }, at: { type: Date, default: Date.now }, note: { type: String, default: "" } }],
  deliveredAt: Date,
  cancelledAt: Date,
  cancelledBy: { type: String, enum: ["user", "admin"] },
  cancellationReason: { type: String, maxlength: 500, default: "" },
  inventoryRestored: { type: Boolean, default: false },
  idempotencyKey: { type: String, sparse: true, unique: true },
}, { timestamps: true });

orderSchema.index({ "paymentInfo.id": 1 }, { unique: true, sparse: true });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, couponCode: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: 1, orderStatus: 1 });
export default mongoose.model("Order", orderSchema);
