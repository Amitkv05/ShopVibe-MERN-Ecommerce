import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true, uppercase: true },
  attributes: { type: Map, of: String, default: {} },
  price: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  active: { type: Boolean, default: true },
  image: { type: String, default: "" },
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Please enter product name"], trim: true, maxlength: 120, index: true },
  description: { type: String, required: [true, "Please enter product description"], trim: true, maxlength: 5000 },
  price: { type: Number, required: [true, "Please enter product price"], min: 0 },
  ratings: { type: Number, default: 0, min: 0, max: 5 },
  images: [{ public_id: { type: String, default: "" }, url: { type: String, required: true } }],
  category: { type: String, required: true, trim: true, index: true },
  categoryRef: { type: mongoose.Schema.ObjectId, ref: "Category", index: true },
  brand: { type: String, trim: true, maxlength: 80, default: "", index: true },
  sku: { type: String, trim: true, uppercase: true, sparse: true, index: true },
  stock: { type: Number, required: true, min: 0, default: 1, alias: "Stock", index: true },
  lowStockThreshold: { type: Number, min: 0, default: 5 },
  variants: { type: [variantSchema], default: [] },
  numOfReviews: { type: Number, default: 0, min: 0 },
  reviews: [reviewSchema],
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  active: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

productSchema.index({ name: "text", description: "text", category: "text", brand: "text" });
productSchema.index({ "variants.sku": 1 }, { sparse: true });
productSchema.index({ active: 1, category: 1, price: 1 });
productSchema.index({ active: 1, ratings: -1 });
productSchema.index({ active: 1, createdAt: -1 });
productSchema.path("variants").validate((variants) => {
  const skus = variants.map((v) => v.sku).filter(Boolean);
  return new Set(skus).size === skus.length;
}, "Variant SKUs must be unique within a product");

export default mongoose.model("Product", productSchema);
