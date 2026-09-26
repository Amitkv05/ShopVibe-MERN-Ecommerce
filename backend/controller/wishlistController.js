import Wishlist from "../models/wishlistModel.js";
import Product from "../models/productModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";

async function populated(userId) {
  return Wishlist.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId, products: [] } }, { upsert: true, new: true }).populate("products", "name price ratings images stock category brand active variants");
}
export const getWishlist = handleAsyncError(async (req, res) => res.json({ success: true, wishlist: await populated(req.user._id) }));
export const addWishlist = handleAsyncError(async (req, res, next) => {
  if (!(await Product.exists({ _id: req.params.productId, active: { $ne: false } }))) return next(new HandleError("Product not found", 404));
  await Wishlist.updateOne({ user: req.user._id }, { $setOnInsert: { user: req.user._id }, $addToSet: { products: req.params.productId } }, { upsert: true });
  res.status(201).json({ success: true, wishlist: await populated(req.user._id) });
});
export const removeWishlist = handleAsyncError(async (req, res) => {
  await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.params.productId } });
  res.json({ success: true, wishlist: await populated(req.user._id) });
});
