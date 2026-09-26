import mongoose from "mongoose";
import validator from "validator";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const addressSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 40, default: "Home" },
  fullName: { type: String, trim: true, maxlength: 80, required: true },
  address: { type: String, trim: true, maxlength: 250, required: true },
  city: { type: String, trim: true, maxlength: 100, required: true },
  state: { type: String, trim: true, maxlength: 100, required: true },
  country: { type: String, trim: true, maxlength: 100, required: true },
  pinCode: { type: String, trim: true, maxlength: 20, required: true },
  phoneNo: { type: String, trim: true, maxlength: 20, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, validate: [validator.isEmail, "Please enter a valid email"], index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  avatar: { public_id: { type: String, default: "" }, url: { type: String, default: "" } },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  addresses: { type: [addressSchema], default: [] },
  isEmailVerified: { type: Boolean, default: false, index: true },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpire: { type: Date, select: false },
  passwordChangedAt: Date,
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpire: { type: Date, select: false },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpire;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpire;
      delete ret.passwordChangedAt;
      delete ret.__v;
      return ret;
    },
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcryptjs.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE || "3d" });
};
userSchema.methods.verifyPassword = function (candidatePassword) {
  return bcryptjs.compare(String(candidatePassword), this.password);
};
userSchema.methods.changedPasswordAfter = function (jwtIssuedAt) {
  if (!this.passwordChangedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAt;
};
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
  this.resetPasswordExpire = Date.now() + (Number(process.env.RESET_TOKEN_MINUTES) || 15) * 60 * 1000;
  return token;
};
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
  this.emailVerificationExpire = Date.now() + (Number(process.env.EMAIL_VERIFY_TOKEN_MINUTES) || 1440) * 60 * 1000;
  return token;
};

export default mongoose.model("User", userSchema);
