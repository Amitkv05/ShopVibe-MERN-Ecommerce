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
    subtitle: "Browse the live catalog by category and subcategory.",
  },
  newArrivals: {
    title: "New Arrivals",
    subtitle: "Recently added products from the live catalog.",
  },
};

export default function CategoriesScreen({ mode = "shop" }) {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
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
    openSubcategory,
  } = useStore();

  const [viewMode, setViewMode] = useState("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [page, setPageNumber] = useState(1);

  useEffect(() => {
    if (!categories.length) void fetchCatalog();
  }, [fetchCatalog, categories.length]);

  const selectedCategoryRecord = useMemo(() => {
    if (selectedCategory === "All") return null;
    const selected = String(selectedCategory || "").trim().toLowerCase();
    return (
      categories.find((category) =>
        [category.id, category.label, category.slug]
          .filter(Boolean)
          .some((value) => String(value).trim().toLowerCase() === selected),
      ) || null
    );
  }, [categories, selectedCategory]);

  const availableSubcategories = useMemo(
    () => selectedCategoryRecord?.subcategories || [],
    [selectedCategoryRecord],
  );

  const selectedSubcategoryRecord = useMemo(() => {
    if (selectedSubcategory === "All") return null;
    const selected = String(selectedSubcategory || "").trim().toLowerCase();
    return (
      availableSubcategories.find((subcategory) =>
        [subcategory.id, subcategory.label, subcategory.slug]
          .filter(Boolean)
          .some((value) => String(value).trim().toLowerCase() === selected),
      ) || null
    );
  }, [availableSubcategories, selectedSubcategory]);

  const chooseCategory = (category) => {
    setSelectedCategory(category?.label || "All");
    setSelectedSubcategory("All");
  };

  useEffect(() => {
    setPageNumber(1);
  }, [mode, selectedCategory, selectedSubcategory, searchQuery, sortBy, priceRange, ratingFilter]);

  useEffect(() => {
    if (mode === "categories") return undefined;

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
        categoryRef:
          selectedCategory !== "All" ? selectedCategoryRecord?.id : undefined,
        category:
          selectedCategory !== "All" && !selectedCategoryRecord
            ? selectedCategory
            : undefined,
        subcategoryRef:
          selectedSubcategory !== "All" ? selectedSubcategoryRecord?.id : undefined,
        subcategory:
          selectedSubcategory !== "All" && !selectedSubcategoryRecord
            ? selectedSubcategory
            : undefined,
        "price[gte]": priceRange[0] > 0 ? priceRange[0] : undefined,
        "price[lte]": priceRange[1] < 100000 ? priceRange[1] : undefined,
        "ratings[gte]": ratingFilter > 0 ? ratingFilter : undefined,
        sort: mode === "newArrivals" ? "-createdAt" : sortMap[sortBy] || "-createdAt",
        page: mode === "newArrivals" ? 1 : page,
        limit: mode === "newArrivals" ? 50 : 12,
      }).catch(() => undefined);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [
    fetchProducts,
    mode,
    selectedCategory,
    selectedCategoryRecord,
    selectedSubcategory,
    selectedSubcategoryRecord,
    searchQuery,
    sortBy,
    priceRange,
    ratingFilter,
    page,
  ]);

  if (mode === "categories") {
    return (
      <CategoryExplorer
        categories={categories}
        selectedCategoryRecord={
          selectedCategoryRecord || categories[0] || null
        }
        chooseCategory={chooseCategory}
        openSubcategory={openSubcategory}
        loading={catalogLoading}
        error={catalogError}
      />
    );
  }

  const filtered = products.filter((product) => {
    if (mode === "newArrivals" && !product.isNew) return false;
    if (
      selectedSizes.length &&
      !product.sizes.some((size) => selectedSizes.includes(size))
    ) {
      return false;
    }
    return true;
  });

  const categoriesWithAll = [
    { id: "All", label: "All", icon: "🛍️", image: "" },
    ...categories,
  ];

  const activeFiltersCount =
    (selectedSizes.length > 0 ? 1 : 0) +
    (ratingFilter > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0) +
    (selectedSubcategory !== "All" ? 1 : 0);

  const copy = viewCopy[mode] || viewCopy.shop;
  const displayedCount = mode === "newArrivals" ? filtered.length : productMeta.productCount;
  const allSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const resetFilters = () => {
    setSelectedSubcategory("All");
    setSelectedSizes([]);
    setRatingFilter(0);
    setPriceRange([0, 100000]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">{copy.title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.subtitle}</p>
        </div>
      </div>

      <div className="sticky top-16 z-30 border-b border-gray-100 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categoriesWithAll.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => chooseCategory(category.id === "All" ? null : category)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
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

          {selectedCategoryRecord && availableSubcategories.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedSubcategory("All")}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedSubcategory === "All"
                    ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                    : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                All {selectedCategoryRecord.label}
              </button>
              {availableSubcategories.map((subcategory) => (
                <button
                  type="button"
                  key={subcategory.id}
                  onClick={() => setSelectedSubcategory(subcategory.label)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedSubcategory === subcategory.label
                      ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                      : "border-gray-200 text-gray-600 hover:border-violet-300 dark:border-gray-700 dark:text-gray-300"
                  }`}
                >
                  {subcategory.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-9 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-violet-950"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">{activeFiltersCount}</span>
              )}
            </button>

            <div className="relative hidden sm:block">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-9 text-sm text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="hidden rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900 md:flex">
              <button type="button" onClick={() => setViewMode("grid")} className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-violet-600 text-white" : "text-gray-500"}`}><Grid3X3 size={16} /></button>
              <button type="button" onClick={() => setViewMode("list")} className={`rounded-lg p-2 ${viewMode === "list" ? "bg-violet-600 text-white" : "text-gray-500"}`}><List size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {filterOpen && (
          <div className="mb-5 grid gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Price range</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input type="number" min="0" value={priceRange[0]} onChange={(event) => setPriceRange([Number(event.target.value || 0), priceRange[1]])} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950" />
                <input type="number" min="0" value={priceRange[1]} onChange={(event) => setPriceRange([priceRange[0], Number(event.target.value || 100000)])} className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Minimum rating</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[0, 3, 4, 4.5].map((rating) => (
                  <button key={rating} type="button" onClick={() => setRatingFilter(rating)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${ratingFilter === rating ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>{rating ? `${rating}+ ★` : "Any"}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Sizes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {allSizes.map((size) => (
                  <button key={size} type="button" onClick={() => setSelectedSizes((current) => current.includes(size) ? current.filter((item) => item !== size) : [...current, size])} className={`rounded-lg px-3 py-2 text-xs font-semibold ${selectedSizes.includes(size) ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>{size}</button>
                ))}
              </div>
              <button type="button" onClick={resetFilters} className="mt-4 text-xs font-semibold text-violet-600 hover:underline">Reset filters</button>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {selectedSubcategoryRecord?.label || selectedCategoryRecord?.label || "All Products"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{displayedCount} products</p>
          </div>
        </div>

        {catalogError && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{catalogError}</div>}

        {catalogLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading products…</div>
        ) : filtered.length ? (
          <div className={viewMode === "list" ? "grid gap-4" : "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4"}>
            {filtered.map((product) => <ProductCard key={product.id} product={product} variant={viewMode} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="font-semibold text-gray-800 dark:text-gray-100">No products found</p>
            <p className="mt-1 text-sm text-gray-500">Try another category, subcategory or filter.</p>
          </div>
        )}

        {mode !== "newArrivals" && productMeta.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPageNumber((current) => Math.max(1, current - 1))} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900">Previous</button>
            <span className="px-3 text-sm text-gray-500">Page {page} of {productMeta.totalPages}</span>
            <button type="button" disabled={page >= productMeta.totalPages} onClick={() => setPageNumber((current) => Math.min(productMeta.totalPages, current + 1))} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryExplorer({ categories, selectedCategoryRecord, chooseCategory, openSubcategory, loading, error }) {
  if (loading && !categories.length) {
    return <div className="min-h-[70vh] bg-gray-50 py-20 text-center text-sm text-gray-500 dark:bg-gray-950">Loading categories…</div>;
  }

  if (error && !categories.length) {
    return <div className="min-h-[70vh] bg-gray-50 px-4 py-20 text-center text-sm text-red-600 dark:bg-gray-950">{error}</div>;
  }

  if (!selectedCategoryRecord) {
    return <div className="min-h-[70vh] bg-gray-50 py-20 text-center text-gray-500 dark:bg-gray-950">No categories available.</div>;
  }

  const subcategories = selectedCategoryRecord.subcategories || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white sm:text-3xl">Shop by Category</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose a category, then open one of its subcategories.</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-[118px_minmax(0,1fr)] bg-white dark:bg-gray-900 sm:grid-cols-[220px_minmax(0,1fr)] lg:my-6 lg:overflow-hidden lg:rounded-3xl lg:border lg:border-gray-100 lg:shadow-sm dark:lg:border-gray-800">
        <aside className="max-h-[calc(100vh-8rem)] overflow-y-auto border-r border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/60">
          {categories.map((category) => {
            const active = selectedCategoryRecord.id === category.id;
            return (
              <button
                type="button"
                key={category.id}
                onClick={() => chooseCategory(category)}
                className={`flex w-full flex-col items-center gap-2 border-b border-gray-100 px-2 py-4 text-center transition sm:flex-row sm:px-4 sm:text-left dark:border-gray-800 ${active ? "border-l-4 border-l-violet-600 bg-white text-violet-700 dark:bg-gray-900 dark:text-violet-300" : "text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-900"}`}
              >
                <CategoryThumb category={category} />
                <span className="text-xs font-bold leading-tight sm:text-sm">{category.label}</span>
              </button>
            );
          })}
        </aside>

        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          {selectedCategoryRecord.banner && (
            <div className="relative mb-6 h-28 overflow-hidden rounded-2xl sm:h-40">
              <img src={selectedCategoryRecord.banner} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">Category</p>
                <h2 className="mt-1 text-xl font-black sm:text-2xl">{selectedCategoryRecord.label}</h2>
              </div>
            </div>
          )}

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">{selectedCategoryRecord.label}</p>
            <h2 className="mt-1 text-xl font-black text-gray-900 dark:text-white sm:text-2xl">Browse subcategories</h2>
            {selectedCategoryRecord.description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{selectedCategoryRecord.description}</p>}
          </div>

          {subcategories.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {subcategories.map((subcategory) => (
                <button
                  type="button"
                  key={subcategory.id}
                  onClick={() => openSubcategory(subcategory.slug || subcategory.id)}
                  className="group text-center"
                >
                  <div className="mx-auto aspect-square w-full max-w-36 overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-100 transition group-hover:-translate-y-1 group-hover:shadow-md dark:bg-gray-800 dark:ring-gray-700">
                    {subcategory.image ? (
                      <img src={subcategory.image} alt={subcategory.label} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100 text-3xl dark:from-violet-950 dark:to-purple-950">🛍️</div>
                    )}
                  </div>
                  <p className="mx-auto mt-2 max-w-36 text-sm font-semibold leading-snug text-gray-800 group-hover:text-violet-700 dark:text-gray-100 dark:group-hover:text-violet-300">{subcategory.label}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-500 dark:border-gray-700">No active subcategories in this category yet.</div>
          )}
        </section>
      </div>
    </div>
  );
}

function CategoryThumb({ category }) {
  const value = category.icon || category.image;
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    return <img src={value} alt="" className="h-12 w-12 rounded-xl bg-white object-cover sm:h-14 sm:w-14" />;
  }
  return <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm dark:bg-gray-800 sm:h-14 sm:w-14">{value || "🛍️"}</span>;
}

function CategoryIcon({ category }) {
  const value = category.icon;
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    return <img src={value} alt="" className="h-5 w-5 rounded object-cover" />;
  }
  return <span>{value || "🛍️"}</span>;
}
