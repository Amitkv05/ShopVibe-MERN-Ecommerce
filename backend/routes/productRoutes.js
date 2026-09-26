import express from "express";
import {
  createProducts, createReviewForProduct, deleteProduct, deleteProductReview, getAdminProducts,
  getAllProducts, getProductDetails, getProductReviews, updateProduct,
} from "../controller/productController.js";
import { roleBasedAccess, verifyUserAuth } from "../middleware/userAuth.js";
import { validate } from "../middleware/validate.js";
import { productCreateSchema } from "../validators/schemas.js";
const router = express.Router();
router.get("/products", getAllProducts);
router.get("/products/:id", getProductDetails);
router.put("/review", verifyUserAuth, createReviewForProduct);
router.route("/reviews").get(getProductReviews).delete(verifyUserAuth, deleteProductReview);
router.route("/admin/products")
  .get(verifyUserAuth, roleBasedAccess("admin"), getAdminProducts)
  .post(verifyUserAuth, roleBasedAccess("admin"), validate(productCreateSchema), createProducts);
router.route("/admin/products/:id")
  .put(verifyUserAuth, roleBasedAccess("admin"), validate(productCreateSchema.partial()), updateProduct)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteProduct);
export default router;
