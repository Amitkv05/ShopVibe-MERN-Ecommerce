import express from "express";
import {
  listSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../controller/subcategoryController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";
import { validate } from "../middleware/validate.js";
import { subcategorySchema } from "../validators/schemas.js";

const router = express.Router();

router.get("/subcategories", listSubcategories);
router.get(
  "/admin/subcategories",
  verifyUserAuth,
  roleBasedAccess("admin"),
  listSubcategories,
);
router.post(
  "/admin/subcategories",
  verifyUserAuth,
  roleBasedAccess("admin"),
  validate(subcategorySchema),
  createSubcategory,
);
router.put(
  "/admin/subcategories/:id",
  verifyUserAuth,
  roleBasedAccess("admin"),
  validate(subcategorySchema.partial()),
  updateSubcategory,
);
router.delete(
  "/admin/subcategories/:id",
  verifyUserAuth,
  roleBasedAccess("admin"),
  deleteSubcategory,
);

export default router;
