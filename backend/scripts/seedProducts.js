import dns from "node:dns";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import Product from "../models/productModel.js";
import products from "./seedProductsData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const DB_URI =
  process.env.DB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;
if (!DB_URI) {
  console.error("Database URL not found in backend/.env");
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(DB_URI);
    console.log("MongoDB connected");

    const existing = await Product.findOne({
      user: { $exists: true, $ne: null },
    })
      .select("user")
      .lean();
    const ownerId = process.env.SEED_USER_ID || existing?.user;
    if (!ownerId)
      throw new Error(
        "No product owner found. Add SEED_USER_ID=<valid user ObjectId> to backend/.env",
      );

    const prepared = products.map((p) => ({ ...p, user: ownerId }));
    const seedSkus = prepared.map((p) => p.sku);

    const removed = await Product.deleteMany({ sku: { $in: seedSkus } });
    if (removed.deletedCount)
      console.log(
        `Removed ${removed.deletedCount} previous copies of these seed products`,
      );

    const inserted = await Product.insertMany(prepared, { ordered: true });
    console.log(`✅ ${inserted.length} products inserted successfully`);
    console.table(
      inserted.map((p) => ({
        name: p.name,
        sku: p.sku,
        category: p.category,
        variants: p.variants?.length || 0,
        stock: p.stock,
      })),
    );
  } catch (error) {
    console.error("❌ Product seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

run();
