import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true, unique: true, index: true },
  products: [{ type: mongoose.Schema.ObjectId, ref: "Product" }],
}, { timestamps: true });

export default mongoose.model("Wishlist", wishlistSchema);
