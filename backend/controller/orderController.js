import crypto from "crypto";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import Order from "../models/orderModel.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";
import { buildOrderQuote, restoreInventory } from "../services/cartService.js";
import { refundRazorpayPayment, verifyRazorpayPayment } from "../services/paymentService.js";
import { sendOrderCreatedEmail, sendOrderStatusEmail } from "../services/notificationService.js";
import { persistOrder } from "../services/orderPersistenceService.js";
import { logger } from "../config/logger.js";


const ORDER_STATUSES = new Set(["Processing", "Shipped", "Delivered", "Cancelled"]);

function parseOptionalOrderStatus(value) {
  if (value === undefined) return null;
  if (typeof value !== "string") {
    throw new HandleError("Invalid order status", 400);
  }
  const status = value.trim();
  if (!ORDER_STATUSES.has(status)) {
    throw new HandleError("Invalid order status", 400);
  }
  return status;
}

function validateShippingInfo(info) {
  const required = ["address", "city", "state", "country", "pinCode", "phoneNo"];
  if (!info || typeof info !== "object") throw new HandleError("Shipping information is required", 400);
  for (const field of required) if (!String(info[field] ?? "").trim()) throw new HandleError(`Shipping ${field} is required`, 400);
  return { fullName: String(info.fullName || "").trim(), ...Object.fromEntries(required.map((f) => [f, String(info[f]).trim()])) };
}
function pagination(req, defaultLimit = 20) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

export const createNewOrder = handleAsyncError(async (req, res, next) => {
  const shippingInfo = validateShippingInfo(req.body.shippingInfo);
  const paymentMethod = String(req.body.paymentMethod || "").toUpperCase();
  if (!["COD", "RAZORPAY"].includes(paymentMethod)) return next(new HandleError("paymentMethod must be COD or RAZORPAY", 400));

  const idempotencyKey = String(req.get("Idempotency-Key") || "").trim().slice(0, 128);
  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey });
    if (existing) return res.status(200).json({ success: true, order: existing, idempotentReplay: true });
  }

  const quote = await buildOrderQuote(req.body.orderItems, { couponCode: req.body.couponCode, userId: req.user._id });
  let paymentInfo;
  let paidAt;
  if (paymentMethod === "RAZORPAY") {
    const details = req.body.paymentInfo || {};
    const paymentId = details.razorpayPaymentId || details.paymentId;
    if (paymentId) {
      const existing = await Order.findOne({ "paymentInfo.id": paymentId });
      if (existing) return res.status(200).json({ success: true, order: existing, idempotentReplay: true });
    }
    paymentInfo = await verifyRazorpayPayment({
      razorpayOrderId: details.razorpayOrderId || details.orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: details.razorpaySignature || details.signature,
      expectedAmount: quote.totalPrice,
      expectedCurrency: quote.currency,
    });
    paidAt = new Date();
  } else {
    paymentInfo = { id: `COD-${crypto.randomUUID()}`, orderId: "", status: "pending" };
  }

  let order;
  try {
    order = await persistOrder({
      userId: req.user._id,
      quote,
      shippingInfo,
      paymentMethod,
      paymentInfo,
      paidAt,
      idempotencyKey,
    });
  } catch (error) {
    // A concurrent retry can hit a unique idempotency/payment index after another
    // request has already completed successfully. Return that order instead of
    // refunding a payment that now belongs to a valid order.
    if (error?.code === 11000) {
      const replayFilters = [];
      if (idempotencyKey) replayFilters.push({ idempotencyKey });
      if (paymentInfo?.id) replayFilters.push({ "paymentInfo.id": paymentInfo.id });
      if (replayFilters.length) {
        const existing = await Order.findOne({ $or: replayFilters });
        if (existing) {
          return res.status(200).json({ success: true, order: existing, idempotentReplay: true });
        }
      }
    }

    if (error?.rollbackErrors?.length) {
      logger.error({ err: error, rollbackErrors: error.rollbackErrors, requestId: req.id }, "Checkout compensation had rollback errors");
    }

    if (paymentMethod === "RAZORPAY" && paymentInfo?.status === "paid") {
      try {
        await refundRazorpayPayment(paymentInfo.id);
      } catch (refundError) {
        logger.error({ err: refundError, paymentId: paymentInfo.id, requestId: req.id }, "Automatic Razorpay refund failed after checkout error");
      }
    }
    throw error;
  }

  const user = await User.findById(req.user._id);
  void sendOrderCreatedEmail(user, order);
  res.status(201).json({ success: true, order });
});

export const getSingleOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return next(new HandleError("Order not found", 404));
  res.json({ success: true, order });
});
export const getMySingleOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return next(new HandleError("Order not found", 404));
  res.json({ success: true, order });
});
export const allMyOrders = handleAsyncError(async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const filter = { user: req.user._id };
  const [orders, total] = await Promise.all([Order.find(filter).sort("-createdAt").skip(skip).limit(limit), Order.countDocuments(filter)]);
  res.json({ success: true, orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
export const getAllOrders = handleAsyncError(async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const status = parseOptionalOrderStatus(req.query.status);
  const filter = status ? { orderStatus: status } : {};
  const [orders, total, amount] = await Promise.all([
    Order.find(filter).populate("user", "name email").sort("-createdAt").skip(skip).limit(limit),
    Order.countDocuments(filter),
    Order.aggregate([{ $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$totalPrice" } } }]),
  ]);
  res.json({ success: true, orders, totalAmount: amount[0]?.totalAmount || 0, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

async function cancelOrder(order, { actorRole, actorId, reason = "" }) {
  if (order.orderStatus !== "Processing") throw new HandleError("Only processing orders can be cancelled", 400);
  if (order.paymentMethod === "RAZORPAY" && order.paymentInfo.status === "paid") {
    await refundRazorpayPayment(order.paymentInfo.id);
    order.paymentInfo.status = "refunded";
  }
  if (!order.inventoryRestored) {
    await restoreInventory(order.orderItems, { actor: actorId, referenceId: order._id, reason: "Order cancellation" });
    order.inventoryRestored = true;
  }
  if (order.couponCode) await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  order.orderStatus = "Cancelled";
  order.cancelledAt = new Date();
  order.cancelledBy = actorRole;
  order.cancellationReason = reason;
  order.statusHistory.push({ status: "Cancelled", note: reason || `Cancelled by ${actorRole}` });
  await order.save();
  const user = await User.findById(order.user);
  if (user) void sendOrderStatusEmail(user, order);
  return order;
}

export const cancelMyOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return next(new HandleError("Order not found", 404));
  await cancelOrder(order, { actorRole: "user", actorId: req.user._id, reason: String(req.body.reason || "").trim() });
  res.json({ success: true, message: "Order cancelled", order });
});

export const updateOrderStatus = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new HandleError("Order not found", 404));
  const status = String(req.body.status || "").trim();
  if (status === "Cancelled") {
    await cancelOrder(order, { actorRole: "admin", actorId: req.user._id, reason: String(req.body.reason || "").trim() });
    return res.json({ success: true, message: "Order status updated", order });
  }
  const transitions = { Processing: ["Shipped"], Shipped: ["Delivered"], Delivered: [], Cancelled: [] };
  if (!transitions[order.orderStatus]?.includes(status)) return next(new HandleError(`Cannot change order status from ${order.orderStatus} to ${status || "empty"}`, 400));
  order.orderStatus = status;
  order.statusHistory.push({ status, note: String(req.body.note || "").trim() });
  if (status === "Delivered") {
    order.deliveredAt = new Date();
    if (order.paymentMethod === "COD") { order.paymentInfo.status = "paid"; order.paidAt = new Date(); }
  }
  await order.save();
  const user = await User.findById(order.user);
  if (user) void sendOrderStatusEmail(user, order);
  res.json({ success: true, message: "Order status updated", order });
});

export const deleteOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new HandleError("Order not found", 404));
  if (!["Delivered", "Cancelled"].includes(order.orderStatus)) return next(new HandleError("Only delivered or cancelled orders can be deleted", 400));
  await order.deleteOne();
  res.json({ success: true, message: "Order deleted successfully" });
});
