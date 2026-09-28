import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import Subcategory from "../models/subcategoryModel.js";
import Product from "../models/productModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import { deleteCloudinaryImage } from "../services/cloudinaryService.js";

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function publicIdOf(value) {
  return String(value?.public_id || "").trim();
}

async function resolveCategory(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (mongoose.isValidObjectId(raw)) {
    const byId = await Category.findById(raw);
    if (byId) return byId;
  }

  const escaped = escapeRegex(raw);
  return Category.findOne({
    $or: [
      { name: { $regex: `^${escaped}$`, $options: "i" } },
      { slug: { $regex: `^${escaped}$`, $options: "i" } },
    ],
  });
}

async function cleanupReplacedAsset(previous, next) {
  const oldPublicId = publicIdOf(previous);
  const nextPublicId = publicIdOf(next);
  if (oldPublicId && oldPublicId !== nextPublicId) {
    await deleteCloudinaryImage(oldPublicId).catch(() => undefined);
  }
}

export const listSubcategories = handleAsyncError(async (req, res) => {
  const admin = req.user?.role === "admin";
  const filter = admin ? {} : { active: { $ne: false } };

  const categoryValue = req.query.categoryRef || req.query.category;
  if (categoryValue) {
    const category = await resolveCategory(categoryValue);
    if (!category) {
      return res.json({ success: true, subcategories: [] });
    }
    filter.categoryRef = category._id;
  }

  const subcategories = await Subcategory.find(filter)
    .populate("categoryRef", "name slug active")
    .sort({ sortOrder: 1, name: 1 });

  res.json({ success: true, subcategories });
});

export const createSubcategory = handleAsyncError(async (req, res, next) => {
  const category = await resolveCategory(req.body.categoryRef);
  if (!category) return next(new HandleError("Valid parent category is required", 400));

  const subcategory = await Subcategory.create({
    ...req.body,
    categoryRef: category._id,
    categoryName: category.name,
  });

  res.status(201).json({ success: true, subcategory });
});

export const updateSubcategory = handleAsyncError(async (req, res, next) => {
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) return next(new HandleError("Subcategory not found", 404));

  const oldImage = subcategory.image?.toObject?.() || subcategory.image;
  const updates = { ...req.body };

  if (updates.categoryRef) {
    const category = await resolveCategory(updates.categoryRef);
    if (!category) return next(new HandleError("Valid parent category is required", 400));
    updates.categoryRef = category._id;
    updates.categoryName = category.name;
  }

  Object.assign(subcategory, updates);
  await subcategory.save();

  if (updates.image) {
    await cleanupReplacedAsset(oldImage, subcategory.image);
  }

  const parentCategory = await Category.findById(subcategory.categoryRef).select("name");
  await Product.updateMany(
    { subcategoryRef: subcategory._id },
    {
      $set: {
        subcategory: subcategory.name,
        ...(parentCategory
          ? { categoryRef: parentCategory._id, category: parentCategory.name }
          : {}),
      },
    },
  );

  res.json({ success: true, subcategory });
});

export const deleteSubcategory = handleAsyncError(async (req, res, next) => {
  const inUse = await Product.exists({ subcategoryRef: req.params.id });
  if (inUse) {
    return next(
      new HandleError(
        "Subcategory is used by products; deactivate it instead",
        409,
      ),
    );
  }

  const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
  if (!subcategory) return next(new HandleError("Subcategory not found", 404));

  const publicId = publicIdOf(subcategory.image);
  if (publicId) await deleteCloudinaryImage(publicId).catch(() => undefined);

  res.json({ success: true, message: "Subcategory deleted" });
});
