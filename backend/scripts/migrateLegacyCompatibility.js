import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: process.env.ENV_FILE || path.join(__dirname, "..", ".env") });

if (!process.env.DB_URI) throw new Error("DB_URI is required");

const apply = process.argv.includes("--apply");
await mongoose.connect(process.env.DB_URI);

try {
  const db = mongoose.connection.db;
  const products = db.collection("products");
  const users = db.collection("users");
  const categories = db.collection("categories");

  const counts = {
    productsMissingActive: await products.countDocuments({ active: { $exists: false } }),
    productsWithLegacyStock: await products.countDocuments({ stock: { $exists: false }, Stock: { $exists: true } }),
    categoriesMissingActive: await categories.countDocuments({ active: { $exists: false } }),
    usersMissingVerificationFlag: await users.countDocuments({ isEmailVerified: { $exists: false } }),
  };

  console.log("Legacy compatibility scan:", counts);

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to backfill legacy fields.");
    process.exitCode = 0;
  } else {
    const [productActive, productStock, categoryActive, legacyUsers] = await Promise.all([
      products.updateMany({ active: { $exists: false } }, { $set: { active: true } }),
      products.updateMany(
        { stock: { $exists: false }, Stock: { $exists: true } },
        [{ $set: { stock: "$Stock" } }, { $unset: "Stock" }],
      ),
      categories.updateMany({ active: { $exists: false } }, { $set: { active: true } }),
      users.updateMany({ isEmailVerified: { $exists: false } }, { $set: { isEmailVerified: true } }),
    ]);

    console.log("Legacy compatibility migration applied:", {
      productsActivated: productActive.modifiedCount,
      productStockMigrated: productStock.modifiedCount,
      categoriesActivated: categoryActive.modifiedCount,
      legacyUsersMarkedVerified: legacyUsers.modifiedCount,
    });
  }
} finally {
  await mongoose.disconnect();
}
