import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("catalog upgrade adds first-class subcategory model and relationships", () => {
  const subcategoryModel = read("models/subcategoryModel.js");
  const productModel = read("models/productModel.js");
  const categoryModel = read("models/categoryModel.js");

  assert.match(subcategoryModel, /categoryRef/);
  assert.match(subcategoryModel, /categoryName/);
  assert.match(productModel, /subcategoryRef/);
  assert.match(productModel, /subcategory:/);
  assert.match(categoryModel, /banner:/);
  assert.match(categoryModel, /legacyId/);
});

test("catalog upgrade exposes category/subcategory/related-product endpoints", () => {
  const productRoutes = read("routes/productRoutes.js");
  const subcategoryRoutes = read("routes/subcategoryRoutes.js");
  const categoryRoutes = read("routes/categoryRoutes.js");

  assert.match(productRoutes, /products\/category\/:category/);
  assert.match(productRoutes, /products\/subcategory\/:subcategory/);
  assert.match(productRoutes, /products\/:id\/related/);
  assert.match(subcategoryRoutes, /admin\/subcategories/);
  assert.match(categoryRoutes, /categories\/tree/);
});

test("legacy catalog migration does not import vendor collection or vendor ownership", () => {
  const migration = read("scripts/importLegacyCatalog.js");
  assert.doesNotMatch(migration, /collection\(["']vendors["']\)/);
  assert.doesNotMatch(migration, /vendorId\s*:/);
  assert.match(migration, /IMPORT_USER_ID/);
  assert.match(migration, /legacyId/);
});
