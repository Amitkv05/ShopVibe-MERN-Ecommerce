import express from "express";
import {
  createBanner,
  deleteBanner,
  listAdminBanners,
  listBanners,
  updateBanner,
} from "../controller/bannerController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";
import { validate } from "../middleware/validate.js";
import { bannerSchema } from "../validators/schemas.js";

const router = express.Router();

router.get("/banners", listBanners);
router.get("/admin/banners", verifyUserAuth, roleBasedAccess("admin"), listAdminBanners);
router.post("/admin/banners", verifyUserAuth, roleBasedAccess("admin"), validate(bannerSchema), createBanner);
router.put("/admin/banners/:id", verifyUserAuth, roleBasedAccess("admin"), validate(bannerSchema.partial()), updateBanner);
router.delete("/admin/banners/:id", verifyUserAuth, roleBasedAccess("admin"), deleteBanner);

export default router;
