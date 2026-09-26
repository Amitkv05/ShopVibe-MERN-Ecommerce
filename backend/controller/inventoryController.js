import Product from "../models/productModel.js";
import InventoryLog from "../models/inventoryLogModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import { adjustInventory } from "../services/inventoryService.js";

export const updateInventory = handleAsyncError(async (req, res) => {
  const product = await adjustInventory({
    productId: req.params.productId,
    variantSku: String(req.body.variantSku || "").toUpperCase(),
    delta: Number(req.body.delta),
    reason: String(req.body.reason || "Admin stock adjustment").trim(),
    actor: req.user._id,
    referenceType: "admin",
  });
  res.json({ success: true, product });
});

export const inventoryHistory = handleAsyncError(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
  const filter = req.params.productId ? { product: req.params.productId } : {};
  const [logs, total] = await Promise.all([
    InventoryLog.find(filter).populate("product", "name sku").populate("actor", "name email").sort("-createdAt").skip((page - 1) * limit).limit(limit),
    InventoryLog.countDocuments(filter),
  ]);
  res.json({ success: true, logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export const lowStockProducts = handleAsyncError(async (req, res) => {
  const rows = await Product.find({ active: { $ne: false } })
    .select("name sku stock lowStockThreshold variants")
    .lean();

  const products = rows
    .map((product) => {
      const lowVariants = (product.variants || []).filter(
        (variant) => variant.active !== false && variant.stock <= product.lowStockThreshold,
      );
      return {
        ...product,
        baseStockLow: product.stock <= product.lowStockThreshold,
        lowVariants,
      };
    })
    .filter((product) => product.baseStockLow || product.lowVariants.length > 0)
    .sort((a, b) => Math.min(a.stock, ...(a.lowVariants || []).map((v) => v.stock)) - Math.min(b.stock, ...(b.lowVariants || []).map((v) => v.stock)))
    .slice(0, 200);

  res.json({ success: true, products });
});
