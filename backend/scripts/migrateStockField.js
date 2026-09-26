import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

if (!process.env.DB_URI) {
  throw new Error("DB_URI is required");
}

await mongoose.connect(process.env.DB_URI);

const products = mongoose.connection.collection("products");
const result = await products.updateMany(
  { stock: { $exists: false }, Stock: { $exists: true } },
  [{ $set: { stock: "$Stock" } }, { $unset: "Stock" }],
);

console.log(`Matched ${result.matchedCount}; migrated ${result.modifiedCount} products.`);
await mongoose.disconnect();
