import { useEffect, useMemo, useState } from "react";

import {
  ChevronDown,
  Grid3X3,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { useStore } from "@/lib/store";

import ProductCard from "@/components/product/ProductCard";

const viewCopy = {
  shop: {
    title: "Shop",
    subtitle: "Browse all products from the live catalog.",
  },

  newArrivals: {
    title: "New Arrivals",

    subtitle: "Products added during the last 30 days.",
  },

  categories: {
    title: "Categories",

    subtitle: "Browse products by category.",
  },
};

export default function CategoriesScreen({ mode = "shop" }) {
  const {
    selectedCategory,
    setSelectedCategory,

    searchQuery,
    setSearchQuery,

    sortBy,
    setSortBy,

    priceRange,
    setPriceRange,

    products,
    categories,

    fetchCatalog,
    fetchProducts,

    productMeta,

    catalogLoading,
    catalogError,
  } = useStore();

  const [viewMode, setViewMode] = useState("grid");

  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedSizes, setSelectedSizes] = useState([]);

  const [ratingFilter, setRatingFilter] = useState(0);

  const [page, setPageNumber] = useState(1);

  /*
   * selectedCategory currently stores
   * the visible category label.
   *
   * Example:
   * Accessories
   *
   * Here we resolve that label to the
   * actual Category object so that the
   * API request can use category._id.
   *
   * We also match slug/name/id
   * case-insensitively so older values
   * like "accessories" still resolve.
   */
  const selectedCategoryRecord = useMemo(() => {
    if (selectedCategory === "All") {
      return null;
    }

    const selected = String(selectedCategory || "")
      .trim()
      .toLowerCase();

    return (
      categories.find((category) =>
        [category.id, category.label, category.slug]
          .filter(Boolean)
          .some((value) => String(value).trim().toLowerCase() === selected),
      ) || null
    );
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!categories.length) {
      void fetchCatalog();
    }
  }, [fetchCatalog, categories.length]);

  useEffect(() => {
    setPageNumber(1);
  }, [mode, selectedCategory, searchQuery, sortBy, priceRange, ratingFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const sortMap = {
        featured: "-createdAt",

        "price-asc": "price",

        "price-desc": "-price",

        rating: "-ratings",

        newest: "-createdAt",
      };

      void fetchProducts({
        keyword: searchQuery.trim() || undefined,

        /*
         * Primary category filter.
         *
         * Instead of:
         * category=Accessories
         *
         * we now send:
         * categoryRef=MongoObjectId
         */
        categoryRef:
          selectedCategory !== "All" ? selectedCategoryRecord?.id : undefined,

        /*
         * Legacy fallback.
         *
         * Only used if for some
         * reason the selected
         * category could not be
         * resolved to a Category
         * document.
         */
        category:
          selectedCategory !== "All" && !selectedCategoryRecord
            ? selectedCategory
            : undefined,

        "price[gte]": priceRange[0] > 0 ? priceRange[0] : undefined,

        "price[lte]": priceRange[1] < 1000 ? priceRange[1] : undefined,

        "ratings[gte]": ratingFilter > 0 ? ratingFilter : undefined,

        sort:
          mode === "newArrivals"
            ? "-createdAt"
            : sortMap[sortBy] || "-createdAt",

        page: mode === "newArrivals" ? 1 : page,

        limit: mode === "newArrivals" ? 50 : 12,
      }).catch(() => undefined);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    fetchProducts,
    mode,

    selectedCategory,
    selectedCategoryRecord,

    searchQuery,

    sortBy,

    priceRange,

    ratingFilter,

    page,
  ]);

  const categoriesWithAll = [
    {
      id: "All",

      label: "All",

      icon: "🛍️",

      image: "",
    },

    ...categories,
  ];

  const toggleSize = (size) =>
    setSelectedSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size],
    );

  const allSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        if (mode === "newArrivals" && !product.isNew) {
          return false;
        }

        if (
          selectedSizes.length &&
          !product.sizes.some((size) => selectedSizes.includes(size))
        ) {
          return false;
        }

        return true;
      }),

    [mode, products, selectedSizes],
  );

  const activeFiltersCount =
    (selectedSizes.length > 0 ? 1 : 0) +
    (ratingFilter > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0);

  const copy = viewCopy[mode] || viewCopy.shop;

  const displayedCount =
    mode === "newArrivals" ? filtered.length : productMeta.productCount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            {copy.title}
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {copy.subtitle}
          </p>
        </div>
      </div>

      {mode === "categories" && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => setSelectedCategory(category.label)}
                className={`group overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                  selectedCategory === category.label
                    ? "border-violet-400 ring-2 ring-violet-100 dark:ring-violet-950"
                    : "border-gray-100 dark:border-gray-800"
                } bg-white dark:bg-gray-900`}
              >
                <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.label}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CategoryIcon category={category} large />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 p-3">
                  <CategoryIcon category={category} />

                  <span className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">
                    {category.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="sticky top-16 z-30 mt-6 border-y border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categoriesWithAll.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => setSelectedCategory(category.label)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.label
                    ? "bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-none"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <CategoryIcon category={category} />

                {category.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-9 text-sm text-gray-900 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-violet-950"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {mode !== "newArrivals" && (
              <div className="relative hidden sm:block">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-8 text-sm text-gray-700 outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                >
                  <option value="featured">Featured</option>

                  <option value="price-asc">Price: Low to High</option>

                  <option value="price-desc">Price: High to Low</option>

                  <option value="rating">Top Rated</option>

                  <option value="newest">Newest</option>
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                filterOpen || activeFiltersCount > 0
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-none"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <SlidersHorizontal size={16} />

              <span className="hidden sm:inline">Filters</span>

              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-violet-600">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="hidden overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 md:flex">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2.5 ${
                  viewMode === "grid"
                    ? "bg-violet-600 text-white"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-800"
                }`}
                aria-label="Grid view"
              >
                <Grid3X3 size={18} />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2.5 ${
                  viewMode === "list"
                    ? "bg-violet-600 text-white"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-800"
                }`}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {filterOpen && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Price Range
                </h4>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ₹{priceRange[0]}
                  </span>

                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange[1]}
                    onChange={(event) =>
                      setPriceRange([priceRange[0], Number(event.target.value)])
                    }
                    className="flex-1 accent-violet-600"
                  />

                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ₹{priceRange[1]}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Size
                </h4>

                <div className="flex flex-wrap gap-2">
                  {allSizes.map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedSizes.includes(size)
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Minimum Rating
                </h4>

                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      onClick={() => setRatingFilter(rating)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        ratingFilter === rating
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {rating === 0 ? "All" : `${rating}★+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSizes([]);

                    setRatingFilter(0);

                    setPriceRange([0, 1000]);
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {displayedCount}
            </span>{" "}
            products found
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
          </p>
        </div>

        {catalogError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {catalogError}
          </div>
        ) : catalogLoading ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">
            Loading products…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-6xl">🔍</div>

            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              No products found
            </h3>

            <p className="mb-6 text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");

                setSelectedCategory("All");

                setPriceRange([0, 1000]);

                setSelectedSizes([]);

                setRatingFilter(0);
              }}
              className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-700"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} variant="list" />
            ))}
          </div>
        )}

        {mode !== "newArrivals" && productMeta.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || catalogLoading}
              onClick={() =>
                setPageNumber((current) => Math.max(1, current - 1))
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900"
            >
              Previous
            </button>

            <span className="px-3 text-sm text-gray-600 dark:text-gray-400">
              Page {productMeta.currentPage} of {productMeta.totalPages}
            </span>

            <button
              type="button"
              disabled={page >= productMeta.totalPages || catalogLoading}
              onClick={() =>
                setPageNumber((current) =>
                  Math.min(productMeta.totalPages, current + 1),
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryIcon({ category, large = false }) {
  const value = category?.icon;

  if (typeof value === "string" && /^https?:\/\//i.test(value)) {
    return (
      <img
        src={value}
        alt=""
        className={`${large ? "h-16 w-16" : "h-5 w-5"} rounded-lg object-cover`}
      />
    );
  }

  return (
    <span className={large ? "text-5xl" : "text-base"}>{value || "🛍️"}</span>
  );
}
