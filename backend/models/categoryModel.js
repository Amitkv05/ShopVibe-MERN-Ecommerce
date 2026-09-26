import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
  slug: { type: String, required: true, trim: true, unique: true, lowercase: true, index: true },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  image: {
    public_id: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  icon: {
    public_id: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);
