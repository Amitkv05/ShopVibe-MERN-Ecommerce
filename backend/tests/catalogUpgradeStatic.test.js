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


test("legacy catalog migration preserves old Cloudinary media and backfills category icons", () => {
  const migration = read("scripts/importLegacyCatalog.js");
  const source = JSON.parse(read("migration/legacy-catalog-data.json"));

  assert.match(migration, /icon:\s*mediaAsset\(source\.icon \|\| source\.image\)/);
  assert.match(migration, /\["image", "icon", "banner"\]\.includes\(key\)/);
  assert.match(migration, /return \{ public_id: "", url: normalized \}/);

  assert.equal(source.categories.length, 14);
  assert.equal(source.categories.filter((item) => String(item.image || "").startsWith("https://res.cloudinary.com/")).length, 14);
  assert.equal(source.categories.filter((item) => String(item.banner || "").startsWith("https://res.cloudinary.com/")).length, 14);

  assert.equal(source.subcategories.length, 56);
  assert.equal(source.subcategories.filter((item) => String(item.image || "").startsWith("https://res.cloudinary.com/")).length, 56);

  assert.equal(source.products.length, 16);
  assert.equal(source.products.filter((item) => Array.isArray(item.images) && item.images.some((url) => String(url).startsWith("https://res.cloudinary.com/"))).length, 16);

  assert.equal(source.banners.length, 3);
  assert.equal(source.banners.filter((item) => String(item.image || "").startsWith("https://res.cloudinary.com/")).length, 3);
});


test("catalog migration honors DNS_SERVERS for Atlas SRV resolution", () => {
  const migration = read("scripts/importLegacyCatalog.js");
  assert.match(migration, /import \{ setServers \} from ["']node:dns["']/);
  assert.match(migration, /process\.env\.DNS_SERVERS/);
  assert.match(migration, /setServers\(customDnsServers\)/);
});


test("legacy media replaces seed placeholders without overwriting real current media by default", () => {
  const migration = read("scripts/importLegacyCatalog.js");
  assert.match(migration, /function isReplaceableSeedMedia\(value\)/);
  assert.ok(migration.includes('url.includes("placehold.co/")'));
  assert.ok(migration.includes('publicId.startsWith("seed/")'));
  assert.ok(migration.includes('hasMedia(value) && (!hasMedia(current) || isReplaceableSeedMedia(current))'));
});
