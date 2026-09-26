import express from "express";
import { verifyUserAuth } from "../middleware/userAuth.js";
import { getWishlist, addWishlist, removeWishlist } from "../controller/wishlistController.js";
const router = express.Router();
router.get("/wishlist", verifyUserAuth, getWishlist);
router.post("/wishlist/:productId", verifyUserAuth, addWishlist);
router.delete("/wishlist/:productId", verifyUserAuth, removeWishlist);
export default router;
