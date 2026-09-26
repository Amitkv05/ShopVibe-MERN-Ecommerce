import express from "express";
import { roleBasedAccess, verifyUserAuth } from "../middleware/userAuth.js";
import { validate } from "../middleware/validate.js";
import { orderCreateSchema } from "../validators/schemas.js";
import {
  allMyOrders, createNewOrder, deleteOrder, getAllOrders, getMySingleOrder, getSingleOrder,
  updateOrderStatus, cancelMyOrder,
} from "../controller/orderController.js";
const router = express.Router();
router.post("/new/order", verifyUserAuth, validate(orderCreateSchema), createNewOrder);
router.get("/orders/user", verifyUserAuth, allMyOrders);
router.get("/order/:id", verifyUserAuth, getMySingleOrder);
router.post("/order/:id/cancel", verifyUserAuth, cancelMyOrder);
router.get("/admin/orders", verifyUserAuth, roleBasedAccess("admin"), getAllOrders);
router.route("/admin/order/:id")
  .get(verifyUserAuth, roleBasedAccess("admin"), getSingleOrder)
  .put(verifyUserAuth, roleBasedAccess("admin"), updateOrderStatus)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteOrder);
export default router;
