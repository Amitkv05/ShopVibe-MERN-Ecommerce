import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: process.env.ENV_FILE || path.join(__dirname, "..", ".env"),
});

const { validateEnvironment } = await import("../config/env.js");
const { connectMongoDatabase, disconnectMongoDatabase } =
  await import("../config/db.js");
const models = await Promise.all([
  import("../models/userModel.js"),
  import("../models/productModel.js"),
  import("../models/orderModel.js"),
  import("../models/cartModel.js"),
  import("../models/wishlistModel.js"),
  import("../models/categoryModel.js"),
  import("../models/subcategoryModel.js"),
  import("../models/couponModel.js"),
  import("../models/inventoryLogModel.js"),
  import("../models/paymentEventModel.js"),
]);

try {
  validateEnvironment();
  await connectMongoDatabase();
  for (const module of models) {
    const Model = module.default;
    await Model.createIndexes();
    console.log(`Indexes ensured: ${Model.modelName}`);
  }
  console.log("Database index creation completed.");
} finally {
  await disconnectMongoDatabase();
}
