import Category from "../models/categoryModel.js";
import Subcategory from "../models/subcategoryModel.js";
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
  const categories = await Category.find(filter).sort({
    sortOrder: 1,
    name: 1,
  });
  res.json({ success: true, categories });
});

// Public category tree for storefront/navigation. It avoids embedding
// subcategories inside Category documents while still returning the nested
// shape the frontend normally wants.
export const getCategoryTree = handleAsyncError(async (req, res) => {
  const categories = await Category.find({ active: { $ne: false } })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const categoryIds = categories.map((category) => category._id);
  const subcategories = await Subcategory.find({
    active: { $ne: false },
    categoryRef: { $in: categoryIds },
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const byCategory = new Map();
  for (const subcategory of subcategories) {
    const key = String(subcategory.categoryRef);
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(subcategory);
  }

  const categoryTree = categories.map((category) => ({
    ...category,
    subcategories: byCategory.get(String(category._id)) || [],
  }));

  res.json({ success: true, categories: categoryTree });
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
  const oldBanner = category.banner?.toObject?.() || category.banner;

  Object.assign(category, req.body);
  await category.save();

  await Promise.allSettled([
    cleanupReplacedAsset(oldImage, category.image),
    cleanupReplacedAsset(oldIcon, category.icon),
    cleanupReplacedAsset(oldBanner, category.banner),
  ]);

  // Keep denormalized category names synchronized for legacy compatibility.
  await Promise.all([
    Product.updateMany(
      { categoryRef: category._id },
      { $set: { category: category.name } },
    ),
    Subcategory.updateMany(
      { categoryRef: category._id },
      { $set: { categoryName: category.name } },
    ),
  ]);

  res.json({ success: true, category });
});

export const deleteCategory = handleAsyncError(async (req, res, next) => {
  const [productInUse, subcategoryInUse] = await Promise.all([
    Product.exists({ categoryRef: req.params.id }),
    Subcategory.exists({ categoryRef: req.params.id }),
  ]);

  if (productInUse || subcategoryInUse) {
    return next(
      new HandleError(
        "Category is used by products/subcategories; deactivate it instead",
        409,
      ),
    );
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new HandleError("Category not found", 404));

  await Promise.allSettled([
    deleteCloudinaryImage(publicIdOf(category.image)),
    deleteCloudinaryImage(publicIdOf(category.icon)),
    deleteCloudinaryImage(publicIdOf(category.banner)),
  ]);

  res.json({ success: true, message: "Category deleted" });
});
