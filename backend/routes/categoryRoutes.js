import express from "express";
import {
  listCategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controller/categoryController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";
import { validate } from "../middleware/validate.js";
import { categorySchema } from "../validators/schemas.js";

const router = express.Router();

router.get("/categories", listCategories);
router.get("/categories/tree", getCategoryTree);
router.get(
  "/admin/categories",
  verifyUserAuth,
  roleBasedAccess("admin"),
  listCategories,
);
router.post(
  "/admin/categories",
  verifyUserAuth,
  roleBasedAccess("admin"),
  validate(categorySchema),
  createCategory,
);
router.put(
  "/admin/categories/:id",
  verifyUserAuth,
  roleBasedAccess("admin"),
  validate(categorySchema.partial()),
  updateCategory,
);
router.delete(
  "/admin/categories/:id",
  verifyUserAuth,
  roleBasedAccess("admin"),
  deleteCategory,
);

export default router;
