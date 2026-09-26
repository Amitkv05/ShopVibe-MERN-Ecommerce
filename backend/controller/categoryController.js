import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import { deleteCloudinaryImage } from "../services/cloudinaryService.js";

function publicIdOf(value) {
  return String(value?.public_id || "").trim();
}

async function cleanupReplacedAsset(previous, next) {
  const oldPublicId = publicIdOf(previous);
  const nextPublicId = publicIdOf(next);

  if (oldPublicId && oldPublicId !== nextPublicId) {
    await deleteCloudinaryImage(oldPublicId).catch(() => undefined);
  }
}

export const listCategories = handleAsyncError(async (req, res) => {
  const filter = req.user?.role === "admin" ? {} : { active: { $ne: false } };
  const categories = await Category.find(filter).sort("name");
  res.json({ success: true, categories });
});

export const createCategory = handleAsyncError(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
});

export const updateCategory = handleAsyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new HandleError("Category not found", 404));

  const oldImage = category.image?.toObject?.() || category.image;
  const oldIcon = category.icon?.toObject?.() || category.icon;

  Object.assign(category, req.body);
  await category.save();

  await Promise.allSettled([
    cleanupReplacedAsset(oldImage, category.image),
    cleanupReplacedAsset(oldIcon, category.icon),
  ]);

  await Product.updateMany(
    { categoryRef: category._id },
    { category: category.name },
  );

  res.json({ success: true, category });
});

export const deleteCategory = handleAsyncError(async (req, res, next) => {
  const inUse = await Product.exists({ categoryRef: req.params.id });
  if (inUse) {
    return next(
      new HandleError(
        "Category is used by products; deactivate it instead",
        409,
      ),
    );
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new HandleError("Category not found", 404));

  await Promise.allSettled([
    deleteCloudinaryImage(publicIdOf(category.image)),
    deleteCloudinaryImage(publicIdOf(category.icon)),
  ]);

  res.json({ success: true, message: "Category deleted" });
});
