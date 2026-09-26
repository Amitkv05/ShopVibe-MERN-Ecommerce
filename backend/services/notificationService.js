import { sendEmail } from "../utils/sendEmail.js";
import { logger } from "../config/logger.js";

async function safeSend(payload) {
  try {
    await sendEmail(payload);
  } catch (error) {
    logger.error({ err: error, email: payload.email, subject: payload.subject }, "Email notification failed");
  }
}

export function sendOrderCreatedEmail(user, order) {
  return safeSend({
    email: user.email,
    subject: `Order ${order._id} confirmed`,
    message: `Hi ${user.name}, your order ${order._id} has been created. Total: ${order.currency} ${order.totalPrice}. Current status: ${order.orderStatus}.`,
  });
}

export function sendOrderStatusEmail(user, order) {
  const extra = [];
  if (order.orderStatus === "Cancelled" && order.cancellationReason) {
    extra.push(`Reason: ${order.cancellationReason}.`);
  }
  if (order.paymentInfo?.status === "refunded") {
    extra.push("Payment refund status: refunded.");
  }

  return safeSend({
    email: user.email,
    subject: `Order ${order._id}: ${order.orderStatus}`,
    message: `Hi ${user.name}, your order ${order._id} status is now ${order.orderStatus}.${extra.length ? ` ${extra.join(" ")}` : ""}`,
  });
}
