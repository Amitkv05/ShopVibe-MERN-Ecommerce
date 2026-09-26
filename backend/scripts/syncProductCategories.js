import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// Same DNS fix jo seed scripts me use kiya tha
const configuredDnsServers = String(process.env.DNS_SERVERS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

dns.setServers(
  configuredDnsServers.length ? configuredDnsServers : ["8.8.8.8", "8.8.4.4"],
);

const DB_URI =
  process.env.DB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

if (!DB_URI) {
  console.error("❌ Database URL not found in backend/.env");

  process.exit(1);
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

async function syncProductCategories() {
  try {
    await mongoose.connect(DB_URI);

    console.log("MongoDB connected");

    const categories = await Category.find({}).lean();

    const products = await Product.find({});

    console.log(`Categories found: ${categories.length}`);

    console.log(`Products found: ${products.length}`);

    let updated = 0;
    let alreadyCorrect = 0;
    let unmatched = 0;

    const unmatchedProducts = [];

    for (const product of products) {
      const productCategory = normalize(product.category);

      if (!productCategory) {
        unmatched += 1;

        unmatchedProducts.push({
          name: product.name,
          category: product.category,
          reason: "Product category is empty",
        });

        continue;
      }

      const matchedCategory = categories.find((category) => {
        const categoryName = normalize(category.name);

        const categorySlug = normalize(category.slug);

        return (
          productCategory === categoryName || productCategory === categorySlug
        );
      });

      if (!matchedCategory) {
        unmatched += 1;

        unmatchedProducts.push({
          name: product.name,
          category: product.category,
          reason: "No matching category found",
        });

        continue;
      }

      const correctCategoryName = matchedCategory.name;

      const correctCategoryRef = matchedCategory._id;

      const categoryNameCorrect = product.category === correctCategoryName;

      const categoryRefCorrect =
        product.categoryRef &&
        String(product.categoryRef) === String(correctCategoryRef);

      if (categoryNameCorrect && categoryRefCorrect) {
        alreadyCorrect += 1;
        continue;
      }

      product.category = correctCategoryName;

      product.categoryRef = correctCategoryRef;

      await product.save();

      updated += 1;

      console.log(`✅ ${product.name} → ${correctCategoryName}`);
    }

    console.log("\n==============================");
    console.log("CATEGORY SYNC COMPLETE");
    console.log("==============================");

    console.log(`Updated: ${updated}`);

    console.log(`Already correct: ${alreadyCorrect}`);

    console.log(`Unmatched: ${unmatched}`);

    console.log(`Total products: ${products.length}`);

    if (unmatchedProducts.length) {
      console.log("\n⚠️ Unmatched products:");

      console.table(unmatchedProducts);
    }
  } catch (error) {
    console.error("❌ Category sync failed:");

    console.error(error);

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log("MongoDB disconnected");
  }
}

syncProductCategories();
