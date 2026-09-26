import Product from "../models/productModel.js";
import InventoryLog from "../models/inventoryLogModel.js";
import HandleError from "../utils/handleError.js";

export async function adjustInventory({ productId, variantSku = "", delta, reason, actor, referenceType = "other", referenceId, session }) {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new HandleError("Inventory delta must be a non-zero integer", 400);
  }
  const product = await Product.findById(productId).session(session || null);
  if (!product) throw new HandleError("Product not found", 404);

  let previousStock;
  let newStock;
  if (variantSku) {
    const variant = product.variants.find((v) => v.sku === String(variantSku).toUpperCase());
    if (!variant) throw new HandleError("Product variant not found", 404);
    previousStock = variant.stock;
    newStock = previousStock + delta;
    if (newStock < 0) throw new HandleError(`Insufficient stock for ${product.name} (${variant.sku})`, 409);
    variant.stock = newStock;
  } else {
    previousStock = product.stock;
    newStock = previousStock + delta;
    if (newStock < 0) throw new HandleError(`Insufficient stock for ${product.name}`, 409);
    product.stock = newStock;
  }

  await product.save({ session });
  await InventoryLog.create([{ product: product._id, variantSku, delta, previousStock, newStock, reason, actor, referenceType, referenceId }], { session });
  return product;
}
