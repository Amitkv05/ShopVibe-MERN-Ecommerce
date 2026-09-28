import dotenv from "dotenv";
import path from "node:path";
import { setServers } from "node:dns";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: process.env.ENV_FILE || path.join(__dirname, "..", ".env") });

const customDnsServers = process.env.DNS_SERVERS?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (customDnsServers?.length) {
  setServers(customDnsServers);
  console.log(`Custom DNS servers enabled for catalog migration: ${customDnsServers.join(", ")}`);
}

const args = process.argv.slice(2);
function argValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const apply = args.includes("--apply");
const overwriteExisting = args.includes("--overwrite-existing");
const importBanners = args.includes("--with-banners");
const catalogFile = argValue("--file") || process.env.LEGACY_CATALOG_FILE || "";

if (!process.env.DB_URI) {
  throw new Error("DB_URI is required for the current ShopVibe database");
}
if (!catalogFile && !process.env.LEGACY_DB_URI) {
  throw new Error("Provide LEGACY_DB_URI or --file <legacy-catalog-data.json>");
}

const legacyDbName = process.env.LEGACY_DB_NAME || undefined;

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "item";
}

function exactRegex(value) {
  const escaped = String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
}

function legacyIdOf(value) {
  return value?._id ? String(value._id) : "";
}

function mediaAsset(url) {
  const normalized = String(url || "").trim();

  // Legacy media can belong to a different Cloudinary account than the
  // current ShopVibe environment. Keep the original URL for display/reuse,
  // but do not invent a public_id that the current Cloudinary credentials
  // may not own. An empty public_id also makes replacement/deletion safe.
  return { public_id: "", url: normalized };
}

function hasMedia(value) {
  return Boolean(String(value?.url || "").trim());
}

function isReplaceableSeedMedia(value) {
  const url = String(value?.url || "").trim().toLowerCase();
  const publicId = String(value?.public_id || "").trim().toLowerCase();
  return url.includes("placehold.co/") || publicId.startsWith("seed/");
}

function nowPair() {
  const now = new Date();
  return { createdAt: now, updatedAt: now };
}

function missingOnlyUpdate(existing, mapped) {
  const update = {};

  for (const [key, value] of Object.entries(mapped)) {
    if (["_id", "createdAt"].includes(key)) continue;
    if (value === undefined) continue;

    const current = existing?.[key];
    const isMediaField = ["image", "icon", "banner"].includes(key);
    const missing =
      current === undefined ||
      current === null ||
      current === "" ||
      (Array.isArray(current) && current.length === 0) ||
      (isMediaField && hasMedia(value) && (!hasMedia(current) || isReplaceableSeedMedia(current)));

    if (missing) update[key] = value;
  }

  update.updatedAt = new Date();
  return update;
}

function mapLegacyCategory(source, id = new mongoose.Types.ObjectId()) {
  return {
    _id: id,
    name: String(source.name || "").trim(),
    slug: slugify(source.name),
    description: "",
    image: mediaAsset(source.image),
    // Old catalog categories did not have a separate icon field. Reuse the
    // old category image as the icon fallback so no manual re-upload is needed.
    icon: mediaAsset(source.icon || source.image),
    banner: mediaAsset(source.banner),
    sortOrder: 0,
    active: true,
    legacyId: legacyIdOf(source),
    ...nowPair(),
  };
}

function mapLegacySubcategory(source, category, id = new mongoose.Types.ObjectId()) {
  return {
    _id: id,
    name: String(source.subCategoryName || source.name || "").trim(),
    slug: slugify(source.subCategoryName || source.name),
    description: "",
    categoryRef: category._id,
    categoryName: category.name,
    image: mediaAsset(source.image),
    sortOrder: 0,
    active: true,
    legacyId: legacyIdOf(source),
    ...nowPair(),
  };
}

function mapLegacyProduct(source, category, subcategory, userId, id = new mongoose.Types.ObjectId()) {
  const oldImages = Array.isArray(source.images) ? source.images : [];
  return {
    _id: id,
    name: String(source.productName || source.name || "").trim(),
    description: String(source.description || "Imported legacy product").trim(),
    price: Number(source.productPrice ?? source.price ?? 0),
    ratings: Number(source.averageRating ?? source.ratings ?? 0),
    images: oldImages
      .map((url) => String(url || "").trim())
      .filter(Boolean)
      .map((url) => mediaAsset(url)),
    category: category.name,
    categoryRef: category._id,
    subcategory: subcategory?.name || String(source.subCategory || "").trim(),
    subcategoryRef: subcategory?._id,
    brand: "",
    stock: Math.max(0, Number.parseInt(source.quantity ?? source.stock ?? 0, 10) || 0),
    lowStockThreshold: 5,
    variants: [],
    numOfReviews: 0,
    reviews: [],
    user: userId,
    popular: Boolean(source.popular),
    recommended: Boolean(source.recommend ?? source.recommended),
    active: true,
    legacyId: legacyIdOf(source),
    ...nowPair(),
  };
}

function mapLegacyBanner(source, index) {
  return {
    title: `Imported Banner ${index + 1}`,
    subtitle: "",
    badge: "",
    ctaText: "Shop Now",
    ctaPath: "/shop",
    image: mediaAsset(source.image),
    overlayOpacity: 0.3,
    textX: 30,
    textY: 50,
    textAlign: "left",
    sortOrder: index,
    active: true,
    ...nowPair(),
  };
}

function createStats() {
  return {
    categories: { source: 0, insert: 0, merge: 0, skip: 0 },
    subcategories: { source: 0, insert: 0, merge: 0, skip: 0 },
    products: { source: 0, insert: 0, merge: 0, skip: 0 },
    banners: { source: 0, insert: 0, skip: 0 },
  };
}

const stats = createStats();

await mongoose.connect(process.env.DB_URI);
let legacy = null;
let fileSource = null;

if (catalogFile) {
  const resolved = path.resolve(process.cwd(), catalogFile);
  fileSource = JSON.parse(fs.readFileSync(resolved, "utf8"));
  for (const key of ["categories", "subcategories", "products", "banners"]) {
    if (!Array.isArray(fileSource[key])) fileSource[key] = [];
  }
} else {
  legacy = mongoose.createConnection(process.env.LEGACY_DB_URI, {
    ...(legacyDbName ? { dbName: legacyDbName } : {}),
  });
  await legacy.asPromise();
}

try {
  const currentDb = mongoose.connection.db;
  const legacyDb = legacy?.db || null;

  const current = {
    categories: currentDb.collection("categories"),
    subcategories: currentDb.collection("subcategories"),
    products: currentDb.collection("products"),
    banners: currentDb.collection("banners"),
    users: currentDb.collection("users"),
  };

  const source = legacyDb
    ? {
        categories: legacyDb.collection("categories"),
        subcategories: legacyDb.collection("subcategories"),
        products: legacyDb.collection("products"),
        banners: legacyDb.collection("banners"),
      }
    : null;

  const [legacyCategories, legacySubcategories, legacyProducts, legacyBanners] = fileSource
    ? [
        fileSource.categories,
        fileSource.subcategories,
        fileSource.products,
        importBanners ? fileSource.banners : [],
      ]
    : await Promise.all([
        source.categories.find({}).toArray(),
        source.subcategories.find({}).toArray(),
        source.products.find({}).toArray(),
        importBanners ? source.banners.find({}).toArray() : Promise.resolve([]),
      ]);

  stats.categories.source = legacyCategories.length;
  stats.subcategories.source = legacySubcategories.length;
  stats.products.source = legacyProducts.length;
  stats.banners.source = legacyBanners.length;

  let importUser = null;
  const requestedUserId = String(process.env.IMPORT_USER_ID || "").trim();
  if (requestedUserId && mongoose.isValidObjectId(requestedUserId)) {
    importUser = await current.users.findOne({ _id: new mongoose.Types.ObjectId(requestedUserId) });
  }
  if (!importUser) importUser = await current.users.findOne({ role: "admin" });

  if (legacyProducts.length && !importUser) {
    throw new Error(
      "No current admin user found. Set IMPORT_USER_ID to a valid ShopVibe user before importing products.",
    );
  }

  const categoryByLegacyId = new Map();
  const categoryByName = new Map();

  for (const oldCategory of legacyCategories) {
    const name = String(oldCategory.name || "").trim();
    if (!name) {
      stats.categories.skip += 1;
      continue;
    }

    const oldId = legacyIdOf(oldCategory);
    const slug = slugify(name);
    let existing = await current.categories.findOne({
      $or: [
        ...(oldId ? [{ legacyId: oldId }] : []),
        { slug },
        { name: exactRegex(name) },
      ],
    });

    let mapped;
    if (existing) {
      mapped = mapLegacyCategory(oldCategory, existing._id);
      const update = overwriteExisting
        ? { ...mapped, _id: undefined, createdAt: existing.createdAt || mapped.createdAt, updatedAt: new Date() }
        : missingOnlyUpdate(existing, mapped);
      delete update._id;

      if (apply && Object.keys(update).length) {
        await current.categories.updateOne({ _id: existing._id }, { $set: update });
        existing = { ...existing, ...update };
      }
      stats.categories.merge += 1;
      mapped = { ...mapped, ...existing, _id: existing._id, name: existing.name || mapped.name };
    } else {
      mapped = mapLegacyCategory(oldCategory);
      if (apply) await current.categories.insertOne(mapped);
      stats.categories.insert += 1;
    }

    if (oldId) categoryByLegacyId.set(oldId, mapped);
    categoryByName.set(name.toLowerCase(), mapped);
  }

  const subcategoryByKey = new Map();

  for (const oldSubcategory of legacySubcategories) {
    const name = String(oldSubcategory.subCategoryName || oldSubcategory.name || "").trim();
    if (!name) {
      stats.subcategories.skip += 1;
      continue;
    }

    const oldCategoryId = String(oldSubcategory.categoryId || "").trim();
    const oldCategoryName = String(oldSubcategory.categoryName || "").trim();
    const category =
      categoryByLegacyId.get(oldCategoryId) ||
      categoryByName.get(oldCategoryName.toLowerCase());

    if (!category) {
      console.warn(`SKIP subcategory "${name}": parent category not found (${oldCategoryName || oldCategoryId})`);
      stats.subcategories.skip += 1;
      continue;
    }

    const oldId = legacyIdOf(oldSubcategory);
    const slug = slugify(name);
    let existing = await current.subcategories.findOne({
      $or: [
        ...(oldId ? [{ legacyId: oldId }] : []),
        { categoryRef: category._id, slug },
      ],
    });

    let mapped;
    if (existing) {
      mapped = mapLegacySubcategory(oldSubcategory, category, existing._id);
      const update = overwriteExisting
        ? { ...mapped, _id: undefined, createdAt: existing.createdAt || mapped.createdAt, updatedAt: new Date() }
        : missingOnlyUpdate(existing, mapped);
      delete update._id;
      if (apply && Object.keys(update).length) {
        await current.subcategories.updateOne({ _id: existing._id }, { $set: update });
        existing = { ...existing, ...update };
      }
      stats.subcategories.merge += 1;
      mapped = { ...mapped, ...existing, _id: existing._id };
    } else {
      mapped = mapLegacySubcategory(oldSubcategory, category);
      if (apply) await current.subcategories.insertOne(mapped);
      stats.subcategories.insert += 1;
    }

    const key = `${String(category._id)}:${name.toLowerCase()}`;
    subcategoryByKey.set(key, mapped);
  }

  for (const oldProduct of legacyProducts) {
    const name = String(oldProduct.productName || oldProduct.name || "").trim();
    const oldCategoryName = String(oldProduct.category || "").trim();
    const oldSubcategoryName = String(oldProduct.subCategory || "").trim();

    if (!name || !oldCategoryName) {
      stats.products.skip += 1;
      continue;
    }

    const category = categoryByName.get(oldCategoryName.toLowerCase());
    if (!category) {
      console.warn(`SKIP product "${name}": category not found (${oldCategoryName})`);
      stats.products.skip += 1;
      continue;
    }

    const subcategory = oldSubcategoryName
      ? subcategoryByKey.get(`${String(category._id)}:${oldSubcategoryName.toLowerCase()}`)
      : null;

    const oldId = legacyIdOf(oldProduct);
    let existing = await current.products.findOne({
      $or: [
        ...(oldId ? [{ legacyId: oldId }] : []),
        { name: exactRegex(name), categoryRef: category._id },
      ],
    });

    let mapped;
    if (existing) {
      mapped = mapLegacyProduct(oldProduct, category, subcategory, importUser._id, existing._id);
      let update;
      if (overwriteExisting) {
        update = { ...mapped, _id: undefined, createdAt: existing.createdAt || mapped.createdAt, updatedAt: new Date() };
        delete update._id;
      } else {
        update = missingOnlyUpdate(existing, mapped);
        // Relationship backfill is safe and is the main reason for this migration.
        update.category = category.name;
        update.categoryRef = category._id;
        if (subcategory) {
          update.subcategory = subcategory.name;
          update.subcategoryRef = subcategory._id;
        }
        if (oldId && !existing.legacyId) update.legacyId = oldId;
      }

      if (apply && Object.keys(update).length) {
        await current.products.updateOne({ _id: existing._id }, { $set: update });
      }
      stats.products.merge += 1;
    } else {
      mapped = mapLegacyProduct(oldProduct, category, subcategory, importUser._id);
      if (apply) await current.products.insertOne(mapped);
      stats.products.insert += 1;
    }
  }

  if (importBanners) {
    for (let index = 0; index < legacyBanners.length; index += 1) {
      const oldBanner = legacyBanners[index];
      const url = String(oldBanner.image || "").trim();
      if (!url) {
        stats.banners.skip += 1;
        continue;
      }

      const existing = await current.banners.findOne({ "image.url": url });
      if (existing) {
        stats.banners.skip += 1;
        continue;
      }

      if (apply) await current.banners.insertOne(mapLegacyBanner(oldBanner, index));
      stats.banners.insert += 1;
    }
  }

  console.log("\nLegacy catalog migration summary");
  console.table(stats);
  console.log({
    mode: apply ? "APPLY" : "DRY RUN",
    overwriteExisting,
    importBanners,
    currentDatabase: mongoose.connection.name,
    legacyDatabase: fileSource ? `file:${catalogFile}` : legacy.name,
    productOwnerUserId: importUser ? String(importUser._id) : null,
  });

  if (!apply) {
    console.log("\nNo data was changed. Re-run with --apply after reviewing this dry-run output.");
  } else {
    console.log("\nMigration applied. Next run: npm run db:indexes and then catalog/API regression tests.");
  }
} finally {
  if (legacy) await legacy.close();
  await mongoose.disconnect();
}
