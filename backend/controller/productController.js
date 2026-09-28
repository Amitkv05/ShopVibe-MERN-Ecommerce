import mongoose from "mongoose";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import Subcategory from "../models/subcategoryModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import APIFunctionality from "../utils/apiFunctionality.js";
import { deleteCloudinaryImage } from "../services/cloudinaryService.js";
import { logger } from "../config/logger.js";
import Cart from "../models/cartModel.js";
import Wishlist from "../models/wishlistModel.js";

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const allowedProductFields = [
  "name",
  "description",
  "price",
  "images",
  "category",
  "categoryRef",
  "subcategory",
  "subcategoryRef",
  "brand",
  "sku",
  "stock",
  "lowStockThreshold",
  "variants",
  "popular",
  "recommended",
  "active",
];

function pickProductFields(body) {
  const source = { ...body };
  if (source.stock === undefined && source.Stock !== undefined) source.stock = source.Stock;

  return Object.fromEntries(
    allowedProductFields
      .filter((field) => source[field] !== undefined)
      .map((field) => [field, source[field]]),
  );
}

async function findCategory(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (mongoose.isValidObjectId(raw)) {
    const byId = await Category.findById(raw).select("_id name slug active");
    if (byId) return byId;
  }

  const escaped = escapeRegex(raw);
  return Category.findOne({
    $or: [
      { name: { $regex: `^${escaped}$`, $options: "i" } },
      { slug: { $regex: `^${escaped}$`, $options: "i" } },
    ],
  }).select("_id name slug active");
}

async function findSubcategory(value, categoryRef = null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (mongoose.isValidObjectId(raw)) {
    const byId = await Subcategory.findById(raw).select(
      "_id name slug categoryRef categoryName active",
    );
    if (byId) return byId;
  }

  const escaped = escapeRegex(raw);
  const filter = {
    $or: [
      { name: { $regex: `^${escaped}$`, $options: "i" } },
      { slug: { $regex: `^${escaped}$`, $options: "i" } },
    ],
  };
  if (categoryRef) filter.categoryRef = categoryRef;

  return Subcategory.findOne(filter).select(
    "_id name slug categoryRef categoryName active",
  );
}

async function resolveCategoryFilter(query) {
  const categoryRef = String(query.categoryRef || "").trim();
  const categoryValue = String(query.category || "").trim();

  if (!categoryRef && !categoryValue) return null;

  let category = null;
  if (categoryRef) category = await findCategory(categoryRef);
  if (!category && categoryValue) category = await findCategory(categoryValue);

  if (category) {
    const aliases = [...new Set([category.name, category.slug].filter(Boolean))];
    return {
      $or: [
        { categoryRef: category._id },
        ...aliases.map((value) => ({
          category: { $regex: `^${escapeRegex(value)}$`, $options: "i" },
        })),
      ],
    };
  }

  if (categoryValue) {
    return {
      category: { $regex: `^${escapeRegex(categoryValue)}$`, $options: "i" },
    };
  }

  // Unknown/malformed explicit ref should never return the full catalog.
  return { _id: null };
}

async function resolveSubcategoryFilter(query, category = null) {
  const subcategoryRef = String(query.subcategoryRef || "").trim();
  const subcategoryValue = String(query.subcategory || "").trim();

  if (!subcategoryRef && !subcategoryValue) return null;

  let subcategory = null;
  const categoryRef = category?._id || null;
  if (subcategoryRef) subcategory = await findSubcategory(subcategoryRef, categoryRef);
  if (!subcategory && subcategoryValue) {
    subcategory = await findSubcategory(subcategoryValue, categoryRef);
  }

  if (subcategory) {
    const aliases = [...new Set([subcategory.name, subcategory.slug].filter(Boolean))];
    return {
      $or: [
        { subcategoryRef: subcategory._id },
        ...aliases.map((value) => ({
          subcategory: { $regex: `^${escapeRegex(value)}$`, $options: "i" },
        })),
      ],
    };
  }

  if (subcategoryValue) {
    return {
      subcategory: {
        $regex: `^${escapeRegex(subcategoryValue)}$`,
        $options: "i",
      },
    };
  }

  return { _id: null };
}

async function normalizeProductTaxonomy(data, current = null) {
  const categoryWasProvided =
    Object.prototype.hasOwnProperty.call(data, "categoryRef") ||
    Object.prototype.hasOwnProperty.call(data, "category");
  const subcategoryWasProvided =
    Object.prototype.hasOwnProperty.call(data, "subcategoryRef") ||
    Object.prototype.hasOwnProperty.call(data, "subcategory");

  let category = null;
  let subcategory = null;

  const requestedCategory = data.categoryRef || data.category;
  if (requestedCategory) {
    category = await findCategory(requestedCategory);
    if (!category) throw new HandleError("Category not found", 400);
  } else if (!categoryWasProvided && current?.categoryRef) {
    category = await Category.findById(current.categoryRef).select("_id name slug active");
  } else if (!categoryWasProvided && current?.category) {
    category = await findCategory(current.category);
  }

  // Explicit empty/null subcategory means remove the relationship.
  const explicitSubcategoryClear =
    subcategoryWasProvided &&
    !String(data.subcategoryRef || "").trim() &&
    !String(data.subcategory || "").trim();

  if (!explicitSubcategoryClear) {
    const requestedSubcategory = data.subcategoryRef || data.subcategory;
    if (requestedSubcategory) {
      subcategory = await findSubcategory(requestedSubcategory, category?._id || null);
      if (!subcategory) throw new HandleError("Subcategory not found", 400);

      const parent = await Category.findById(subcategory.categoryRef).select("_id name slug active");
      if (!parent) throw new HandleError("Subcategory parent category not found", 400);

      if (category && String(category._id) !== String(parent._id)) {
        throw new HandleError("Subcategory does not belong to the selected category", 400);
      }
      category = parent;
    } else if (!subcategoryWasProvided && current?.subcategoryRef) {
      subcategory = await Subcategory.findById(current.subcategoryRef).select(
        "_id name slug categoryRef categoryName active",
      );
      if (subcategory && category && String(subcategory.categoryRef) !== String(category._id)) {
        subcategory = null;
      }
    }
  }

  if (!category) {
    throw new HandleError("A valid category/categoryRef is required", 400);
  }

  data.categoryRef = category._id;
  data.category = category.name;

  if (subcategory) {
    data.subcategoryRef = subcategory._id;
    data.subcategory = subcategory.name;
  } else if (explicitSubcategoryClear || (categoryWasProvided && current?.subcategoryRef)) {
    data.subcategoryRef = null;
    data.subcategory = "";
  }

  return data;
}

async function cleanupCloudinaryImages(images = [], context = {}) {
  const publicIds = [
    ...new Set(
      images
        .map((image) => String(image?.public_id || "").trim())
        .filter(Boolean),
    ),
  ];
  if (!publicIds.length) return { attempted: 0, removed: 0, failed: 0 };

  const results = await Promise.allSettled(
    publicIds.map((publicId) => deleteCloudinaryImage(publicId)),
  );
  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length) {
    logger.warn(
      { ...context, attempted: publicIds.length, failed: failed.length },
      "Some Cloudinary assets could not be deleted",
    );
  }
  return {
    attempted: publicIds.length,
    removed: publicIds.length - failed.length,
    failed: failed.length,
  };
}

async function listProducts(req, res, admin = false, overrideQuery = {}) {
  const queryParams = { ...req.query, ...overrideQuery };

  let resolvedCategory = null;
  const categoryLookup = queryParams.categoryRef || queryParams.category;
  if (categoryLookup) resolvedCategory = await findCategory(categoryLookup);

  const categoryFilter = await resolveCategoryFilter(queryParams);
  const subcategoryFilter = await resolveSubcategoryFilter(
    queryParams,
    resolvedCategory,
  );

  delete queryParams.category;
  delete queryParams.categoryRef;
  delete queryParams.subcategory;
  delete queryParams.subcategoryRef;

  const baseFilter = admin ? {} : { active: { $ne: false } };
  const relationshipFilters = [categoryFilter, subcategoryFilter].filter(Boolean);
  if (relationshipFilters.length === 1) Object.assign(baseFilter, relationshipFilters[0]);
  if (relationshipFilters.length > 1) baseFilter.$and = relationshipFilters;

  const baseQuery = Product.find(baseFilter);
  const features = new APIFunctionality(baseQuery, queryParams)
    .search()
    .filter()
    .sort();
  const countQuery = features.query.clone();
  const total = await countQuery.countDocuments();

  features.pagination(12, 50);
  const products = await features.query;

  res.status(200).json({
    success: true,
    products,
    productCount: total,
    resultPerPage: features.limit,
    totalPages: Math.ceil(total / features.limit),
    currentPage: features.page,
  });
}

export const createProducts = handleAsyncError(async (req, res, next) => {
  const data = pickProductFields(req.body);
  if (!data.name || !data.description || data.price === undefined) {
    return next(new HandleError("Name, description and price are required", 400));
  }

  try {
    await normalizeProductTaxonomy(data);
  } catch (error) {
    return next(error);
  }

  data.user = req.user.id;
  const product = await Product.create(data);
  res.status(201).json({ success: true, product });
});

export const getAllProducts = handleAsyncError(async (req, res) =>
  listProducts(req, res, false),
);
export const getAdminProducts = handleAsyncError(async (req, res) =>
  listProducts(req, res, true),
);

export const getProductsByCategory = handleAsyncError(async (req, res) =>
  listProducts(req, res, false, { category: req.params.category }),
);

export const getProductsBySubcategory = handleAsyncError(async (req, res) =>
  listProducts(req, res, false, { subcategory: req.params.subcategory }),
);

export const getRelatedProducts = handleAsyncError(async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params.id,
    active: { $ne: false },
  });
  if (!product) return next(new HandleError("Product not found", 404));

  const requestedLimit = Number.parseInt(req.query.limit, 10) || 8;
  const limit = Math.min(Math.max(requestedLimit, 1), 20);

  let relationshipFilter;
  let matchType;
  if (product.subcategoryRef) {
    relationshipFilter = { subcategoryRef: product.subcategoryRef };
    matchType = "subcategory";
  } else if (product.subcategory) {
    relationshipFilter = {
      subcategory: {
        $regex: `^${escapeRegex(product.subcategory)}$`,
        $options: "i",
      },
    };
    matchType = "subcategory";
  } else if (product.categoryRef) {
    relationshipFilter = { categoryRef: product.categoryRef };
    matchType = "category-fallback";
  } else {
    relationshipFilter = {
      category: {
        $regex: `^${escapeRegex(product.category)}$`,
        $options: "i",
      },
    };
    matchType = "category-fallback";
  }

  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    active: { $ne: false },
    ...relationshipFilter,
  })
    .sort({ ratings: -1, createdAt: -1 })
    .limit(limit);

  res.status(200).json({ success: true, matchType, relatedProducts });
});

export const updateProduct = handleAsyncError(async (req, res, next) => {
  const updates = pickProductFields(req.body);
  if (Object.keys(updates).length === 0) {
    return next(new HandleError("No supported product fields were provided", 400));
  }

  const current = await Product.findById(req.params.id);
  if (!current) return next(new HandleError("Product not found", 404));

  if (
    updates.category !== undefined ||
    updates.categoryRef !== undefined ||
    updates.subcategory !== undefined ||
    updates.subcategoryRef !== undefined
  ) {
    try {
      await normalizeProductTaxonomy(updates, current);
    } catch (error) {
      return next(error);
    }
  }

  const previousImages = updates.images
    ? current.images.map((image) => image.toObject?.() ?? image)
    : [];
  Object.assign(current, updates);
  await current.save();

  let mediaCleanup;
  if (updates.images) {
    const retained = new Set(
      (updates.images || [])
        .map((image) => String(image?.public_id || "").trim())
        .filter(Boolean),
    );
    const removedImages = previousImages.filter(
      (image) => image?.public_id && !retained.has(String(image.public_id)),
    );
    mediaCleanup = await cleanupCloudinaryImages(removedImages, {
      productId: current._id,
      requestId: req.id,
      operation: "product-image-replace",
    });
  }

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: current,
    ...(mediaCleanup ? { mediaCleanup } : {}),
  });
});

export const deleteProduct = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new HandleError("Product not found", 404));

  const images = product.images.map((image) => image.toObject?.() ?? image);
  await product.deleteOne();
  await Promise.all([
    Cart.updateMany({}, { $pull: { items: { product: product._id } } }),
    Wishlist.updateMany({}, { $pull: { products: product._id } }),
  ]);
  const mediaCleanup = await cleanupCloudinaryImages(images, {
    productId: product._id,
    requestId: req.id,
    operation: "product-delete",
  });

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
    mediaCleanup,
  });
});

export const getProductDetails = handleAsyncError(async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params.id,
    active: { $ne: false },
  })
    .populate("categoryRef", "name slug image banner active")
    .populate("subcategoryRef", "name slug image categoryRef active");
  if (!product) return next(new HandleError("Product not found", 404));
  res.status(200).json({ success: true, product });
});

export const createReviewForProduct = handleAsyncError(async (req, res, next) => {
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();
  const productId = req.body.productId;

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return next(new HandleError("Rating must be between 1 and 5", 400));
  }
  if (!comment) return next(new HandleError("Review comment is required", 400));

  const product = await Product.findById(productId);
  if (!product) return next(new HandleError("Product not found", 404));

  const existingReview = product.reviews.find(
    (review) => String(review.user) === String(req.user._id),
  );

  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.name = req.user.name;
  } else {
    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating,
      comment,
    });
  }

  product.numOfReviews = product.reviews.length;
  product.ratings =
    product.numOfReviews === 0
      ? 0
      : product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.numOfReviews;

  await product.save();
  res.status(200).json({ success: true, message: "Review saved successfully" });
});

export const getProductReviews = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.id).select("reviews");
  if (!product) return next(new HandleError("Product not found", 404));
  res.status(200).json({ success: true, reviews: product.reviews });
});

export const deleteProductReview = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);
  if (!product) return next(new HandleError("Product not found", 404));

  const review = product.reviews.id(req.query.id);
  if (!review) return next(new HandleError("Review not found", 404));

  const ownsReview = String(review.user) === String(req.user._id);
  const isAdmin = req.user.role === "admin";
  if (!ownsReview && !isAdmin) {
    return next(new HandleError("You can only delete your own review", 403));
  }

  product.reviews.pull(review._id);
  product.numOfReviews = product.reviews.length;
  product.ratings =
    product.numOfReviews === 0
      ? 0
      : product.reviews.reduce((sum, item) => sum + item.rating, 0) /
        product.numOfReviews;

  await product.save();
  res.status(200).json({ success: true, message: "Review deleted successfully" });
});
