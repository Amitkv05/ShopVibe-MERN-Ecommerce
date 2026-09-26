import Product from "../models/productModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import APIFunctionality from "../utils/apiFunctionality.js";
import { deleteCloudinaryImage } from "../services/cloudinaryService.js";
import { logger } from "../config/logger.js";
import Cart from "../models/cartModel.js";
import Wishlist from "../models/wishlistModel.js";
import Category from "../models/categoryModel.js";

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function resolveCategoryFilter(query) {
  const categoryRef = String(query.categoryRef || "").trim();
  const categoryValue = String(query.category || "").trim();

  if (!categoryRef && !categoryValue) return null;

  let category = null;

  if (/^[a-f\d]{24}$/i.test(categoryRef)) {
    category = await Category.findById(categoryRef)
      .select("_id name slug")
      .lean();
  }

  if (!category && categoryValue) {
    const escaped = escapeRegex(categoryValue);

    category = await Category.findOne({
      $or: [
        {
          name: {
            $regex: `^${escaped}$`,
            $options: "i",
          },
        },
        {
          slug: {
            $regex: `^${escaped}$`,
            $options: "i",
          },
        },
      ],
    })
      .select("_id name slug")
      .lean();
  }

  if (category) {
    const aliases = [
      ...new Set([category.name, category.slug].filter(Boolean)),
    ];

    return {
      $or: [
        {
          categoryRef: category._id,
        },

        ...aliases.map((value) => ({
          category: {
            $regex: `^${escapeRegex(value)}$`,
            $options: "i",
          },
        })),
      ],
    };
  }

  if (categoryValue) {
    return {
      category: {
        $regex: `^${escapeRegex(categoryValue)}$`,
        $options: "i",
      },
    };
  }

  // Invalid / unknown categoryRef should return zero products,
  // not the complete catalog.
  return {
    _id: null,
  };
}

const allowedProductFields = [
  "name",
  "description",
  "price",
  "images",
  "category",
  "categoryRef",
  "brand",
  "sku",
  "stock",
  "lowStockThreshold",
  "variants",
  "active",
];

function pickProductFields(body) {
  const source = {
    ...body,
  };

  if (source.stock === undefined && source.Stock !== undefined) {
    source.stock = source.Stock;
  }

  return Object.fromEntries(
    allowedProductFields
      .filter((field) => source[field] !== undefined)
      .map((field) => [field, source[field]]),
  );
}

async function cleanupCloudinaryImages(images = [], context = {}) {
  const publicIds = [
    ...new Set(
      images
        .map((image) => String(image?.public_id || "").trim())
        .filter(Boolean),
    ),
  ];

  if (!publicIds.length) {
    return {
      attempted: 0,
      removed: 0,
      failed: 0,
    };
  }

  const results = await Promise.allSettled(
    publicIds.map((publicId) => deleteCloudinaryImage(publicId)),
  );

  const failed = results.filter((result) => result.status === "rejected");

  if (failed.length) {
    logger.warn(
      {
        ...context,
        attempted: publicIds.length,
        failed: failed.length,
      },
      "Some Cloudinary assets could not be deleted",
    );
  }

  return {
    attempted: publicIds.length,
    removed: publicIds.length - failed.length,
    failed: failed.length,
  };
}

async function listProducts(req, res, admin = false) {
  const queryParams = {
    ...req.query,
  };

  const categoryFilter = await resolveCategoryFilter(queryParams);

  /*
   * Category filtering is handled
   * separately because this controller
   * knows about the Category model.
   *
   * APIFunctionality will continue
   * handling:
   *
   * keyword
   * price
   * rating
   * stock
   * sorting
   * pagination
   */

  delete queryParams.category;
  delete queryParams.categoryRef;

  const baseFilter = admin ? {} : { active: { $ne: false } };

  if (categoryFilter) {
    Object.assign(baseFilter, categoryFilter);
  }

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

  if (
    !data.name ||
    !data.description ||
    data.price === undefined ||
    !data.category
  ) {
    return next(
      new HandleError(
        "Name, description, price and category are required",
        400,
      ),
    );
  }

  data.user = req.user.id;

  const product = await Product.create(data);

  res.status(201).json({
    success: true,
    product,
  });
});

export const getAllProducts = handleAsyncError(async (req, res) =>
  listProducts(req, res, false),
);

export const getAdminProducts = handleAsyncError(async (req, res) =>
  listProducts(req, res, true),
);

export const updateProduct = handleAsyncError(async (req, res, next) => {
  const updates = pickProductFields(req.body);

  if (Object.keys(updates).length === 0) {
    return next(
      new HandleError("No supported product fields were provided", 400),
    );
  }

  const current = await Product.findById(req.params.id);

  if (!current) {
    return next(new HandleError("Product not found", 404));
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

    ...(mediaCleanup
      ? {
          mediaCleanup,
        }
      : {}),
  });
});

export const deleteProduct = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  const images = product.images.map((image) => image.toObject?.() ?? image);

  await product.deleteOne();

  await Promise.all([
    Cart.updateMany(
      {},
      {
        $pull: {
          items: {
            product: product._id,
          },
        },
      },
    ),

    Wishlist.updateMany(
      {},
      {
        $pull: {
          products: product._id,
        },
      },
    ),
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

    active: {
      $ne: false,
    },
  });

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

export const createReviewForProduct = handleAsyncError(
  async (req, res, next) => {
    const rating = Number(req.body.rating);

    const comment = String(req.body.comment || "").trim();

    const productId = req.body.productId;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return next(new HandleError("Rating must be between 1 and 5", 400));
    }

    if (!comment) {
      return next(new HandleError("Review comment is required", 400));
    }

    const product = await Product.findById(productId);

    if (!product) {
      return next(new HandleError("Product not found", 404));
    }

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

    res.status(200).json({
      success: true,

      message: "Review saved successfully",
    });
  },
);

export const getProductReviews = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.id).select("reviews");

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

export const deleteProductReview = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  const review = product.reviews.id(req.query.id);

  if (!review) {
    return next(new HandleError("Review not found", 404));
  }

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

  res.status(200).json({
    success: true,

    message: "Review deleted successfully",
  });
});
