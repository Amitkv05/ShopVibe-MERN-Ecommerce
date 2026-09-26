import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import Order from "../models/orderModel.js";
import HandleError from "../utils/handleError.js";

const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new HandleError("Order items are required", 400);
  const combined = new Map();
  for (const item of items) {
    const productId = String(item.product || item.productId || "").trim();
    const quantity = Number(item.quantity);
    const variantSku = String(item.variantSku || "").trim().toUpperCase();
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new HandleError("Each order item requires a valid product and quantity", 400);
    const key = `${productId}:${variantSku}`;
    const current = combined.get(key);
    combined.set(key, { productId, quantity: (current?.quantity || 0) + quantity, variantSku });
  }
  return [...combined.values()];
}

async function calculateCoupon({ couponCode, itemsPrice, userId }) {
  if (!couponCode) return { couponCode: "", discountPrice: 0, coupon: null };
  const code = String(couponCode).trim().toUpperCase();
  const coupon = await Coupon.findOne({ code, active: true });
  if (!coupon) throw new HandleError("Coupon is invalid", 400);
  const now = new Date();
  if (coupon.startsAt > now || coupon.expiresAt <= now) throw new HandleError("Coupon is not currently valid", 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new HandleError("Coupon usage limit has been reached", 400);
  if (itemsPrice < coupon.minOrderAmount) throw new HandleError(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`, 400);
  if (userId) {
    const used = await Order.countDocuments({ user: userId, couponCode: code, orderStatus: { $ne: "Cancelled" } });
    if (used >= coupon.perUserLimit) throw new HandleError("You have already used this coupon the maximum number of times", 400);
  }
  let discountPrice = coupon.type === "percent" ? itemsPrice * (coupon.value / 100) : coupon.value;
  if (coupon.maxDiscountAmount) discountPrice = Math.min(discountPrice, coupon.maxDiscountAmount);
  discountPrice = money(Math.min(discountPrice, itemsPrice));
  return { couponCode: code, discountPrice, coupon };
}

export async function buildOrderQuote(rawItems, { couponCode = "", userId } = {}) {
  const items = normalizeItems(rawItems);
  const products = await Product.find({ _id: { $in: items.map((i) => i.productId) }, active: { $ne: false } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));
  if (productMap.size !== new Set(items.map((i) => i.productId)).size) throw new HandleError("One or more products are unavailable", 400);

  const snapshotItems = items.map((item) => {
    const product = productMap.get(item.productId);
    let price = product.price;
    let availableStock = product.stock;
    let variantAttributes = {};
    const hasActiveVariants = product.variants.some((v) => v.active !== false);
    if (hasActiveVariants && !item.variantSku) {
      throw new HandleError(`Please select a variant for ${product.name}`, 400);
    }
    if (item.variantSku) {
      const variant = product.variants.find((v) => v.sku === item.variantSku && v.active !== false);
      if (!variant) throw new HandleError(`Variant ${item.variantSku} is unavailable`, 400);
      price = variant.price ?? product.price;
      availableStock = variant.stock;
      variantAttributes = Object.fromEntries(variant.attributes || []);
    }
    if (availableStock < item.quantity) throw new HandleError(`Insufficient stock for ${product.name}`, 409);
    return {
      product: product._id,
      name: product.name,
      price: money(price),
      quantity: item.quantity,
      image: product.images?.[0]?.url || "",
      variantSku: item.variantSku,
      variantAttributes,
    };
  });

  const itemsPrice = money(snapshotItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const couponData = await calculateCoupon({ couponCode, itemsPrice, userId });
  const discountedSubtotal = money(itemsPrice - couponData.discountPrice);
  const taxRate = Math.max(Number(process.env.TAX_RATE) || 0, 0);
  const taxPrice = money(discountedSubtotal * taxRate);
  const shippingFlatRate = Math.max(Number(process.env.SHIPPING_FLAT_RATE) || 0, 0);
  const freeShippingThreshold = Math.max(Number(process.env.FREE_SHIPPING_THRESHOLD) || 0, 0);
  const shippingPrice = freeShippingThreshold > 0 && discountedSubtotal >= freeShippingThreshold ? 0 : money(shippingFlatRate);
  const totalPrice = money(discountedSubtotal + taxPrice + shippingPrice);
  return { orderItems: snapshotItems, itemsPrice, discountPrice: couponData.discountPrice, couponCode: couponData.couponCode, coupon: couponData.coupon, taxPrice, shippingPrice, totalPrice, currency: (process.env.CURRENCY || "INR").toUpperCase() };
}

export async function reserveInventory(orderItems, { session, actor, referenceId } = {}) {
  const reserved = [];
  try {
    for (const item of orderItems) {
      const filter = { _id: item.product };
      const update = {};
      if (item.variantSku) {
        filter.variants = { $elemMatch: { sku: item.variantSku, stock: { $gte: item.quantity }, active: { $ne: false } } };
        update.$inc = { "variants.$.stock": -item.quantity };
      } else {
        filter.stock = { $gte: item.quantity };
        update.$inc = { stock: -item.quantity };
      }
      const before = await Product.findOneAndUpdate(filter, update, { new: false, session });
      if (!before) throw new HandleError(`Insufficient stock for ${item.name}`, 409);
      const prev = item.variantSku ? before.variants.find((v) => v.sku === item.variantSku)?.stock : before.stock;
      const newStock = prev - item.quantity;
      const InventoryLog = (await import("../models/inventoryLogModel.js")).default;
      await InventoryLog.create([{ product: item.product, variantSku: item.variantSku, delta: -item.quantity, previousStock: prev, newStock, reason: "Order inventory reservation", actor, referenceType: "order", referenceId }], { session });
      reserved.push(item);
    }
  } catch (error) {
    if (!session) await restoreInventory(reserved, { actor, referenceId, reason: "Rollback after failed reservation" });
    throw error;
  }
}

export async function restoreInventory(orderItems, { session, actor, referenceId, reason = "Order inventory restoration", referenceType = "refund" } = {}) {
  const InventoryLog = (await import("../models/inventoryLogModel.js")).default;
  for (const item of orderItems) {
    const product = await Product.findById(item.product).session(session || null);
    if (!product) continue;
    let prev;
    let newStock;
    if (item.variantSku) {
      const variant = product.variants.find((v) => v.sku === item.variantSku);
      if (!variant) continue;
      prev = variant.stock;
      variant.stock += item.quantity;
      newStock = variant.stock;
    } else {
      prev = product.stock;
      product.stock += item.quantity;
      newStock = product.stock;
    }
    await product.save({ session });
    await InventoryLog.create([{ product: item.product, variantSku: item.variantSku, delta: item.quantity, previousStock: prev, newStock, reason, actor, referenceType, referenceId }], { session });
  }
}
