import mongoose from "mongoose";

const mediaAssetSchema = new mongoose.Schema(
  {
    public_id: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false },
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true, index: true },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    image: { type: mediaAssetSchema, default: () => ({ public_id: "", url: "" }) },
    icon: { type: mediaAssetSchema, default: () => ({ public_id: "", url: "" }) },
    // Category-level hero/banner. This intentionally stays separate from the
    // home-page Banner collection because the legacy catalog stores a banner
    // per category.
    banner: { type: mediaAssetSchema, default: () => ({ public_id: "", url: "" }) },
    sortOrder: { type: Number, min: 0, max: 9999, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
    // Used only for safe/idempotent legacy catalog imports.
    legacyId: { type: String, trim: true, default: undefined },
  },
  { timestamps: true },
);

categorySchema.index({ active: 1, sortOrder: 1, name: 1 });
categorySchema.index({ legacyId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Category", categorySchema);
