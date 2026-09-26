import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import { buildOrderQuote } from "../services/cartService.js";

async function getCart(userId) {
  return Cart.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId, items: [] } }, { upsert: true, new: true }).populate("items.product", "name price images stock variants active");
}
export const readCart = handleAsyncError(async (req, res) => {
  const cart = await getCart(req.user._id);
  res.json({ success: true, cart });
});
export const addCartItem = handleAsyncError(async (req, res, next) => {
  const { product: productId, quantity = 1, variantSku = "" } = req.body;
  const requestedQty = Number(quantity);
  if (!Number.isInteger(requestedQty) || requestedQty < 1 || requestedQty > 99) {
    return next(new HandleError("Quantity must be an integer between 1 and 99", 400));
  }

  const product = await Product.findById(productId);
  if (!product || product.active === false) return next(new HandleError("Product unavailable", 404));

  const sku = String(variantSku || "").trim().toUpperCase();
  const activeVariants = product.variants.filter((variant) => variant.active !== false);
  let availableStock = product.stock;

  if (activeVariants.length > 0) {
    if (!sku) return next(new HandleError(`Please select a variant for ${product.name}`, 400));
    const variant = activeVariants.find((item) => item.sku === sku);
    if (!variant) return next(new HandleError("Selected product variant is unavailable", 400));
    availableStock = variant.stock;
  } else if (sku) {
    return next(new HandleError("This product does not use variants", 400));
  }

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { user: req.user._id, items: [] } },
    { upsert: true, new: true },
  );

  const existing = cart.items.find((item) => String(item.product) === String(productId) && item.variantSku === sku);
  const nextQuantity = Math.min((existing?.quantity || 0) + requestedQty, 99);
  if (nextQuantity > availableStock) return next(new HandleError(`Only ${availableStock} item(s) are available`, 409));

  if (existing) existing.quantity = nextQuantity;
  else cart.items.push({ product: productId, quantity: requestedQty, variantSku: sku });

  await cart.save();
  res.status(201).json({ success: true, cart: await getCart(req.user._id) });
});
export const updateCartItem = handleAsyncError(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new HandleError("Cart not found", 404));

  const sku = String(req.body.variantSku || "").trim().toUpperCase();
  const item = cart.items.find((entry) => String(entry.product) === String(req.params.productId) && entry.variantSku === sku);
  if (!item) return next(new HandleError("Cart item not found", 404));

  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return next(new HandleError("Quantity must be 1-99", 400));

  const product = await Product.findById(req.params.productId);
  if (!product || product.active === false) return next(new HandleError("Product unavailable", 404));
  const availableStock = sku
    ? product.variants.find((variant) => variant.sku === sku && variant.active !== false)?.stock
    : product.stock;
  if (availableStock === undefined) return next(new HandleError("Selected product variant is unavailable", 400));
  if (quantity > availableStock) return next(new HandleError(`Only ${availableStock} item(s) are available`, 409));

  item.quantity = quantity;
  await cart.save();
  res.json({ success: true, cart: await getCart(req.user._id) });
});
export const removeCartItem = handleAsyncError(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    const sku = String(req.query.variantSku || "").toUpperCase();
    cart.items = cart.items.filter((i) => !(String(i.product) === String(req.params.productId) && i.variantSku === sku));
    await cart.save();
  }
  res.json({ success: true, cart: await getCart(req.user._id) });
});
export const clearCart = handleAsyncError(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { upsert: true });
  res.json({ success: true, message: "Cart cleared" });
});
export const quoteCart = handleAsyncError(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  const orderItems = (cart?.items || []).map((i) => ({ product: i.product, quantity: i.quantity, variantSku: i.variantSku }));
  const quote = await buildOrderQuote(orderItems, { couponCode: req.body.couponCode, userId: req.user._id });
  res.json({ success: true, quote });
});
