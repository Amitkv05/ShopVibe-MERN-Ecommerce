import crypto from "crypto";
import validator from "validator";
import handleAsyncError from "../middleware/handleAsyncError.js";
import User from "../models/userModel.js";
import HandleError from "../utils/handleError.js";
import { clearAuthCookie, sendToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import { logger } from "../config/logger.js";

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HandleError(`${field} is required`, 400);
  }
  return value.trim();
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new HandleError("Password must contain at least 8 characters", 400);
  }
}

export const registerUser = handleAsyncError(async (req, res) => {
  const name = requireText(req.body.name, "Name");
  const email = requireText(req.body.email, "Email").toLowerCase();
  const password = req.body.password;

  if (!validator.isEmail(email)) throw new HandleError("Please enter a valid email", 400);
  validatePassword(password);

  const user = await User.create({ name, email, password });
  const verifyToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const verifyUrl = `${clientUrl}/verify-email/${verifyToken}`;
  try {
    await sendEmail({ email: user.email, subject: "Verify your email", message: `Verify your email using this link: ${verifyUrl}` });
  } catch (error) {
    logger.error({ err: error, userId: user._id, requestId: req.id }, "Verification email delivery failed");
  }

  sendToken(user, 201, res);
});

export const loginUser = handleAsyncError(async (req, res, next) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return next(new HandleError("Please enter email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.verifyPassword(password))) {
    return next(new HandleError("Invalid email or password", 401));
  }

  // Backward compatibility for accounts created before email verification existed.
  // We only promote a legacy account after its password has been verified.
  const rawVerificationState = await User.collection.findOne(
    { _id: user._id },
    { projection: { isEmailVerified: 1 } },
  );
  const hasStoredVerificationFlag = Object.prototype.hasOwnProperty.call(
    rawVerificationState || {},
    "isEmailVerified",
  );

  if (!hasStoredVerificationFlag) {
    await User.collection.updateOne(
      { _id: user._id, isEmailVerified: { $exists: false } },
      { $set: { isEmailVerified: true } },
    );
    user.isEmailVerified = true;
  }

  if (
    String(process.env.REQUIRE_EMAIL_VERIFICATION).toLowerCase() === "true" &&
    user.isEmailVerified !== true
  ) {
    return next(new HandleError("Please verify your email before logging in", 403));
  }

  sendToken(user, 200, res);
});

export const logout = handleAsyncError(async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export const requestPasswordReset = handleAsyncError(async (req, res, next) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!validator.isEmail(email)) {
    return next(new HandleError("Please enter a valid email", 400));
  }

  const genericMessage = "If an account exists for that email, a password reset link has been sent.";
  const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    return res.status(200).json({ success: true, message: genericMessage });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetPasswordURL = `${clientUrl}/reset-password/${resetToken}`;
  const minutes = Number(process.env.RESET_TOKEN_MINUTES) || 15;
  const message = `Use the following link to reset your password: ${resetPasswordURL}\n\nThis link will expire in ${minutes} minutes. If you did not request a password reset, you can ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    logger.error({ err: error, userId: user._id, requestId: req.id }, "Password reset email delivery failed");
  }

  res.status(200).json({ success: true, message: genericMessage });
});

export const resetPassword = handleAsyncError(async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  validatePassword(password);

  if (password !== confirmPassword) {
    return next(new HandleError("Password and confirm password do not match", 400));
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(String(req.params.token))
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    return next(new HandleError("Password reset token is invalid or expired", 400));
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, res);
});

export const getUserDetails = handleAsyncError(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export const updatePassword = handleAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return next(new HandleError("Old password, new password and confirm password are required", 400));
  }

  validatePassword(newPassword);
  if (newPassword !== confirmPassword) {
    return next(new HandleError("New password and confirm password do not match", 400));
  }

  const user = await User.findById(req.user.id).select("+password");
  if (!user) return next(new HandleError("User not found", 404));

  if (!(await user.verifyPassword(oldPassword))) {
    return next(new HandleError("Old password is incorrect", 400));
  }

  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});

export const updateProfile = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new HandleError("User not found", 404));

  let emailChanged = false;
  if (req.body.name !== undefined) user.name = requireText(req.body.name, "Name");
  if (req.body.email !== undefined) {
    const email = requireText(req.body.email, "Email").toLowerCase();
    if (!validator.isEmail(email)) return next(new HandleError("Please enter a valid email", 400));
    emailChanged = email !== user.email;
    user.email = email;
    if (emailChanged) user.isEmailVerified = false;
  }

  if (req.body.name === undefined && req.body.email === undefined) {
    return next(new HandleError("No supported profile fields were provided", 400));
  }

  let verifyToken;
  if (emailChanged) verifyToken = user.generateEmailVerificationToken();
  await user.save();

  if (emailChanged && verifyToken) {
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    try {
      await sendEmail({
        email: user.email,
        subject: "Verify your updated email",
        message: `Verify your updated email using this link: ${clientUrl}/verify-email/${verifyToken}`,
      });
    } catch (error) {
      logger.error({ err: error, userId: user._id, requestId: req.id }, "Updated email verification delivery failed");
    }
  }

  res.status(200).json({ success: true, user });
});

export const getUsersList = handleAsyncError(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().sort("-createdAt").skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getSingleUser = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new HandleError("User not found", 404));
  res.status(200).json({ success: true, user });
});

export const updateUser = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("+emailVerificationToken +emailVerificationExpire");
  if (!user) return next(new HandleError("User not found", 404));

  let changed = false;
  let emailChanged = false;

  if (req.body.name !== undefined) {
    user.name = requireText(req.body.name, "Name");
    changed = true;
  }

  if (req.body.email !== undefined) {
    const email = requireText(req.body.email, "Email").toLowerCase();
    if (!validator.isEmail(email)) return next(new HandleError("Please enter a valid email", 400));
    emailChanged = email !== user.email;
    user.email = email;
    if (emailChanged) user.isEmailVerified = false;
    changed = true;
  }

  if (req.body.role !== undefined) {
    const role = String(req.body.role).toLowerCase();
    if (!["user", "admin"].includes(role)) {
      return next(new HandleError("Role must be either user or admin", 400));
    }
    user.role = role;
    changed = true;
  }

  if (!changed) {
    return next(new HandleError("No supported user fields were provided", 400));
  }

  let verifyToken;
  if (emailChanged) verifyToken = user.generateEmailVerificationToken();
  await user.save();

  if (emailChanged && verifyToken) {
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    try {
      await sendEmail({
        email: user.email,
        subject: "Verify your updated email",
        message: `Verify your updated email using this link: ${clientUrl}/verify-email/${verifyToken}`,
      });
    } catch (error) {
      logger.error({ err: error, userId: user._id, requestId: req.id }, "Admin-updated email verification delivery failed");
    }
  }

  res.status(200).json({ success: true, message: "User updated successfully", user });
});

// Backward-compatible export for any older imports.
export const updateUserRole = updateUser;

export const deleteUser = handleAsyncError(async (req, res, next) => {
  if (String(req.user._id) === String(req.params.id)) {
    return next(new HandleError("You cannot delete your own admin account from this endpoint", 400));
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new HandleError("User not found", 404));

  res.status(200).json({ success: true, message: "User deleted successfully" });
});


export const verifyEmail = handleAsyncError(async (req, res, next) => {
  const hashed = crypto.createHash("sha256").update(String(req.params.token)).digest("hex");
  const user = await User.findOne({ emailVerificationToken: hashed, emailVerificationExpire: { $gt: Date.now() } }).select("+emailVerificationToken +emailVerificationExpire");
  if (!user) return next(new HandleError("Email verification token is invalid or expired", 400));
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: "Email verified successfully" });
});

export const resendVerificationEmail = handleAsyncError(async (req, res) => {
  const user = await User.findById(req.user._id).select("+emailVerificationToken +emailVerificationExpire");
  if (user.isEmailVerified) return res.json({ success: true, message: "Email is already verified" });
  const token = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  await sendEmail({ email: user.email, subject: "Verify your email", message: `Verify your email using this link: ${clientUrl}/verify-email/${token}` });
  res.json({ success: true, message: "Verification email sent" });
});
