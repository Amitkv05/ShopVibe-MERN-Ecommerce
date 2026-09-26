import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Coupon from "../models/couponModel.js";
import Cart from "../models/cartModel.js";
import HandleError from "../utils/handleError.js";
import { reserveInventory, restoreInventory } from "./cartService.js";
import { getDatabaseCapabilities } from "../config/databaseCapabilities.js";
import { logger } from "../config/logger.js";

function orderDocument({ orderId, userId, quote, shippingInfo, paymentMethod, paymentInfo, paidAt, idempotencyKey }) {
  return {
    _id: orderId,
    shippingInfo,
    orderItems: quote.orderItems,
    paymentMethod,
    paymentInfo,
    paidAt,
    itemsPrice: quote.itemsPrice,
    discountPrice: quote.discountPrice,
    couponCode: quote.couponCode,
    taxPrice: quote.taxPrice,
    shippingPrice: quote.shippingPrice,
    totalPrice: quote.totalPrice,
    currency: quote.currency,
    user: userId,
    idempotencyKey: idempotencyKey || undefined,
    statusHistory: [{ status: "Processing", note: "Order created" }],
  };
}

async function consumeCoupon(coupon, { session } = {}) {
  if (!coupon) return false;
  const now = new Date();
  const filter = {
    _id: coupon._id,
    active: true,
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
  };
  if (Number.isFinite(coupon.usageLimit)) filter.usedCount = { $lt: coupon.usageLimit };
  const result = await Coupon.updateOne(filter, { $inc: { usedCount: 1 } }, { session });
  if (result.modifiedCount !== 1) {
    throw new HandleError("Coupon is no longer available", 409);
  }
  return true;
}

async function releaseCoupon(coupon) {
  if (!coupon) return;
  await Coupon.updateOne({ _id: coupon._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

async function clearCartBestEffort(userId) {
  try {
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });
  } catch (error) {
    // The order is already valid at this point. A stale cart is preferable to
    // rolling back a completed purchase or refunding a captured payment.
    logger.warn({ err: error, userId }, "Order completed but cart could not be cleared");
  }
}

async function persistWithSession(input, session) {
  const orderId = new mongoose.Types.ObjectId();
  await reserveInventory(input.quote.orderItems, {
    session,
    actor: input.userId,
    referenceId: orderId,
  });
  await consumeCoupon(input.quote.coupon, { session });
  const [order] = await Order.create([orderDocument({ ...input, orderId })], { session });
  return order;
}

async function persistWithCompensation(input) {
  const orderId = new mongoose.Types.ObjectId();
  let inventoryReserved = false;
  let couponConsumed = false;

  try {
    await reserveInventory(input.quote.orderItems, {
      actor: input.userId,
      referenceId: orderId,
    });
    inventoryReserved = true;

    couponConsumed = await consumeCoupon(input.quote.coupon);

    const [order] = await Order.create([orderDocument({ ...input, orderId })]);
    return order;
  } catch (error) {
    const rollbackErrors = [];

    if (couponConsumed) {
      try { await releaseCoupon(input.quote.coupon); }
      catch (rollbackError) { rollbackErrors.push(`coupon rollback: ${rollbackError.message}`); }
    }
    if (inventoryReserved) {
      try {
        await restoreInventory(input.quote.orderItems, {
          actor: input.userId,
          referenceId: orderId,
          reason: "Compensating rollback after checkout failure",
          referenceType: "rollback",
        });
      } catch (rollbackError) {
        rollbackErrors.push(`inventory rollback: ${rollbackError.message}`);
      }
    }

    if (rollbackErrors.length) error.rollbackErrors = rollbackErrors;
    throw error;
  }
}

export async function persistOrder(input) {
  const capabilities = getDatabaseCapabilities();
  if (!capabilities.checked) {
    throw new HandleError("Database capabilities are not initialized", 503);
  }

  let order;
  if (!capabilities.transactionsEnabled) {
    order = await persistWithCompensation(input);
  } else {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        order = await persistWithSession(input, session);
      }, {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      });
    } finally {
      await session.endSession();
    }
  }

  await clearCartBestEffort(input.userId);
  return order;
}
