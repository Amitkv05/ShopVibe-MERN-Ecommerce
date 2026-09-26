import crypto from "crypto";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import { buildOrderQuote } from "../services/cartService.js";
import { createRazorpayOrder } from "../services/paymentService.js";
import PaymentEvent from "../models/paymentEventModel.js";
import Order from "../models/orderModel.js";

export const createPaymentOrder = handleAsyncError(async (req, res) => {
  const quote = await buildOrderQuote(req.body.orderItems, { couponCode: req.body.couponCode, userId: req.user._id });
  const gatewayOrder = await createRazorpayOrder(quote);
  res.status(201).json({
    success: true,
    paymentOrder: gatewayOrder,
    quote: { itemsPrice: quote.itemsPrice, discountPrice: quote.discountPrice, couponCode: quote.couponCode, taxPrice: quote.taxPrice, shippingPrice: quote.shippingPrice, totalPrice: quote.totalPrice, currency: quote.currency },
  });
});

export const razorpayWebhook = handleAsyncError(async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return next(new HandleError("Razorpay webhook is not configured", 503));
  const signature = req.get("x-razorpay-signature") || "";
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
  const generated = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(generated);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return next(new HandleError("Invalid webhook signature", 400));

  const payload = JSON.parse(body.toString("utf8"));
  const payment = payload.payload?.payment?.entity;
  const refund = payload.payload?.refund?.entity;
  const paymentId = payment?.id || refund?.payment_id;
  const eventId = req.get("x-razorpay-event-id") || `${payload.event}:${paymentId || payload.created_at}`;
  let event = await PaymentEvent.findOne({ eventId });
  if (event?.processed) return res.status(200).json({ success: true, duplicate: true });

  if (!event) {
    try {
      event = await PaymentEvent.create({
        eventId,
        eventType: payload.event || "unknown",
        paymentId,
        orderId: payment?.order_id || refund?.order_id,
        processed: false,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      event = await PaymentEvent.findOne({ eventId });
      if (event?.processed) return res.status(200).json({ success: true, duplicate: true });
    }
  }

  if (!event) return next(new HandleError("Could not persist webhook event", 500));
  event.attempts += 1;
  event.lastError = "";
  await event.save();

  try {
    if (paymentId) {
      const order = await Order.findOne({ "paymentInfo.id": paymentId });
      if (order) {
        if (payload.event === "payment.captured") {
          order.paymentInfo.status = "paid";
          order.paidAt ||= new Date();
        }
        if (payload.event === "payment.failed" && order.paymentInfo.status !== "paid") {
          order.paymentInfo.status = "failed";
        }
        if (payload.event === "refund.processed") order.paymentInfo.status = "refunded";
        await order.save();
      }
    }
    event.processed = true;
    event.processedAt = new Date();
    event.lastError = "";
    await event.save();
    res.status(200).json({ success: true });
  } catch (error) {
    event.lastError = String(error.message || "Webhook processing failed").slice(0, 1000);
    await event.save().catch(() => {});
    throw error;
  }
});
