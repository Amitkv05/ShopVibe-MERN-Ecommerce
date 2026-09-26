import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    subtitle: { type: String, trim: true, maxlength: 300, default: "" },
    badge: { type: String, trim: true, maxlength: 80, default: "" },
    ctaText: { type: String, trim: true, maxlength: 60, default: "Shop Now" },
    ctaPath: { type: String, trim: true, maxlength: 200, default: "/shop" },
    image: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    overlayOpacity: { type: Number, min: 0, max: 0.9, default: 0.3 },
    textX: { type: Number, min: 0, max: 100, default: 30 },
    textY: { type: Number, min: 0, max: 100, default: 50 },
    textAlign: {
      type: String,
      enum: ["left", "center", "right"],
      default: "left",
    },
    sortOrder: { type: Number, min: 0, max: 9999, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

bannerSchema.index({ active: 1, sortOrder: 1, createdAt: -1 });

export default mongoose.model("Banner", bannerSchema);
