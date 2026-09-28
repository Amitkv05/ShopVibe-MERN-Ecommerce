import mongoose from "mongoose";

const mediaAssetSchema = new mongoose.Schema(
  {
    public_id: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false },
);

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    categoryRef: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    // Denormalized display name for fast/simple legacy compatibility. The
    // canonical relationship is categoryRef.
    categoryName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    image: {
      type: mediaAssetSchema,
      default: () => ({ public_id: "", url: "" }),
    },
    sortOrder: { type: Number, min: 0, max: 9999, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
    legacyId: { type: String, trim: true, default: undefined },
  },
  { timestamps: true },
);

// Same subcategory slug may exist under a different category, but not twice
// under the same parent category.
subcategorySchema.index({ categoryRef: 1, slug: 1 }, { unique: true });
subcategorySchema.index({ active: 1, categoryRef: 1, sortOrder: 1, name: 1 });
subcategorySchema.index({ legacyId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Subcategory", subcategorySchema);
