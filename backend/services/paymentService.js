import crypto from "crypto";
import Razorpay from "razorpay";
import HandleError from "../utils/handleError.js";

function requireRazorpayConfig() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new HandleError("Razorpay is not configured on the server", 503);
  }
}

function getClient() {
  requireRazorpayConfig();
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function createRazorpayOrder({ totalPrice, currency }) {
  const client = getClient();
  const amount = Math.round(totalPrice * 100);

  const order = await client.orders.create({
    amount,
    currency,
    receipt: `order_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`,
  });

  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID,
  };
}

export async function verifyRazorpayPayment({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  expectedAmount,
  expectedCurrency,
}) {
  requireRazorpayConfig();

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new HandleError("Complete Razorpay payment information is required", 400);
  }

  const generated = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(generated, "utf8");
  const receivedBuffer = Buffer.from(String(razorpaySignature), "utf8");
  const validSignature =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!validSignature) {
    throw new HandleError("Payment signature verification failed", 400);
  }

  const client = getClient();
  const [gatewayOrder, payment] = await Promise.all([
    client.orders.fetch(razorpayOrderId),
    client.payments.fetch(razorpayPaymentId),
  ]);

  const expectedAmountPaise = Math.round(expectedAmount * 100);

  if (
    Number(gatewayOrder.amount) !== expectedAmountPaise ||
    Number(payment.amount) !== expectedAmountPaise ||
    String(gatewayOrder.currency).toUpperCase() !== String(expectedCurrency).toUpperCase() ||
    String(payment.currency).toUpperCase() !== String(expectedCurrency).toUpperCase()
  ) {
    throw new HandleError("Payment amount does not match the server-calculated order total", 400);
  }

  if (payment.order_id !== razorpayOrderId || payment.status !== "captured") {
    throw new HandleError("Payment has not been captured successfully", 400);
  }

  return {
    id: razorpayPaymentId,
    orderId: razorpayOrderId,
    status: "paid",
  };
}

export async function refundRazorpayPayment(paymentId) {
  if (!paymentId) throw new HandleError("Payment ID is required for refund", 400);
  const client = getClient();
  return client.payments.refund(paymentId, {});
}
