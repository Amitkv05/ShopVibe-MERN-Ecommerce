import express from "express";
import { createPaymentOrder } from "../controller/paymentController.js";
import { verifyUserAuth } from "../middleware/userAuth.js";
const router = express.Router();
router.post("/payment/order", verifyUserAuth, createPaymentOrder);
export default router;
