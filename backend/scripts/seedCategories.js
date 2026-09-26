import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Category from "../models/categoryModel.js";
import categories from "./seedCategoriesData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Same Atlas SRV DNS workaround used for product seeding.
const configuredDnsServers = String(process.env.DNS_SERVERS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

dns.setServers(
  configuredDnsServers.length
    ? configuredDnsServers
    : ["8.8.8.8", "8.8.4.4"],
);

const DB_URI =
  process.env.DB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

if (!DB_URI) {
  console.error(
    "Database URL not found. Add DB_URI (or MONGO_URI/MONGODB_URI/DATABASE_URL) in backend/.env",
  );
  process.exit(1);
}

async function seedCategories() {
  try {
    await mongoose.connect(DB_URI);
    console.log("MongoDB connected");

    let created = 0;
    let updated = 0;

    for (const category of categories) {
      const escapedName = category.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const existing = await Category.findOne({
        $or: [
          { slug: category.slug },
          { name: new RegExp(`^${escapedName}$`, "i") },
        ],
      });

      if (existing) {
        existing.name = category.name;
        existing.slug = category.slug;
        existing.description = category.description;
        existing.image = category.image;
        existing.icon = category.icon;
        existing.active = category.active;
        await existing.save();
        updated += 1;
      } else {
        await Category.create(category);
        created += 1;
      }
    }

    const total = await Category.countDocuments();

    console.log("✅ Category seed complete");
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Total categories currently in database: ${total}`);

    console.table(
      categories.map((category) => ({
        name: category.name,
        slug: category.slug,
        active: category.active,
      })),
    );
  } catch (error) {
    console.error("❌ Category seed failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

seedCategories();
