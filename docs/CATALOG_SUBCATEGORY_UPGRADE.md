# ShopVibe Catalog Hierarchy Upgrade

This upgrade extends the existing catalog without removing the current category/product model.

```text
Category
  └── Subcategory
        └── Product
```

## What changed

- Category supports optional `banner`, `sortOrder`, and `legacyId`.
- New `Subcategory` collection with parent `categoryRef`.
- Product supports optional `subcategory` and `subcategoryRef` while keeping existing `category`/`categoryRef` compatibility.
- Customer category browser now shows a category sidebar and subcategory grid.
- Selecting a subcategory opens a dedicated product-listing screen.
- Shop filters now support category + dependent subcategory filtering.
- Product details use subcategory-aware breadcrumbs and related-product loading.
- Admin has a dedicated Subcategories tab.
- Admin product create/edit uses dependent Category → Subcategory selection.
- Legacy catalog migration supports dry-run and idempotent merge.
- Vendor/multi-vendor data is intentionally ignored.

## New API routes

```text
GET    /api/v1/categories/tree
GET    /api/v1/subcategories
GET    /api/v1/products/category/:category
GET    /api/v1/products/subcategory/:subcategory
GET    /api/v1/products/:id/related

GET    /api/v1/admin/subcategories
POST   /api/v1/admin/subcategories
PUT    /api/v1/admin/subcategories/:id
DELETE /api/v1/admin/subcategories/:id
```

Existing product/category/banner endpoints remain available.

## Legacy snapshot included

`backend/migration/legacy-catalog-data.json` contains the sanitized legacy catalog used for migration testing:

```text
Categories:    14
Subcategories: 56
Products:      16
Banners:       available but skipped by default
Vendors:       not included
```

The migration preserves legacy Cloudinary URLs. Moving those assets into the current Cloudinary account can be handled later as a separate media migration.
