import express from "express";
import {
  deleteUser, getSingleUser, getUserDetails, getUsersList, loginUser, logout, registerUser,
  requestPasswordReset, resetPassword, updatePassword, updateProfile, updateUser,
  verifyEmail, resendVerificationEmail,
} from "../controller/userController.js";
import { roleBasedAccess, verifyUserAuth } from "../middleware/userAuth.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { authSchemas } from "../validators/schemas.js";

const router = express.Router();
router.post("/register", authLimiter, validate(authSchemas.register), registerUser);
router.post("/login", authLimiter, validate(authSchemas.login), loginUser);
router.post("/logout", logout);
router.post("/forgot/password", passwordResetLimiter, requestPasswordReset);
router.put("/reset/:token", passwordResetLimiter, resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/verify-email/resend", verifyUserAuth, resendVerificationEmail);
router.get("/profile", verifyUserAuth, getUserDetails);
router.post("/password/update", verifyUserAuth, updatePassword);
router.put("/profile/update", verifyUserAuth, updateProfile);
router.get("/admin/users", verifyUserAuth, roleBasedAccess("admin"), getUsersList);
router.route("/admin/user/:id")
  .get(verifyUserAuth, roleBasedAccess("admin"), getSingleUser)
  .put(verifyUserAuth, roleBasedAccess("admin"), updateUser)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteUser);
export default router;
