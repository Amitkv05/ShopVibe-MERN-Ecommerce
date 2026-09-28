import express from "express";
import {
  createProducts,
  createReviewForProduct,
  deleteProduct,
  deleteProductReview,
  getAdminProducts,
  getAllProducts,
  getProductDetails,
  getProductReviews,
  getProductsByCategory,
  getProductsBySubcategory,
  getRelatedProducts,
  updateProduct,
} from "../controller/productController.js";
import { roleBasedAccess, verifyUserAuth } from "../middleware/userAuth.js";
import { validate } from "../middleware/validate.js";
import { productCreateSchema } from "../validators/schemas.js";

const router = express.Router();

router.get("/products", getAllProducts);
// These named routes must be registered before /products/:id.
router.get("/products/category/:category", getProductsByCategory);
router.get("/products/subcategory/:subcategory", getProductsBySubcategory);
router.get("/products/:id/related", getRelatedProducts);
router.get("/products/:id", getProductDetails);

router.put("/review", verifyUserAuth, createReviewForProduct);
router.get("/reviews", getProductReviews);
router.delete("/reviews", verifyUserAuth, deleteProductReview);

router.get(
  "/admin/products",
  verifyUserAuth,
  roleBasedAccess("admin"),
  getAdminProducts,
);
router.post(
  "/admin/products",
  verifyUserAuth,
  roleBasedAccess("admin"),
  validate(productCreateSchema),
  createProducts,
);
router.put(
  "/admin/products/:id",
  verifyUserAuth,
  roleBasedAccess("admin"),
  validate(productCreateSchema.partial()),
  updateProduct,
);
router.delete(
  "/admin/products/:id",
  verifyUserAuth,
  roleBasedAccess("admin"),
  deleteProduct,
);

export default router;
