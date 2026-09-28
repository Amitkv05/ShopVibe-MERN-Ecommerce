import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import ProductCard from "@/components/product/ProductCard";

export default function SubcategoryProductsScreen() {
  const {
    selectedSubcategorySlug,
    categories,
    products,
    productMeta,
    catalogLoading,
    catalogError,
    fetchTaxonomy,
    fetchProducts,
    openSubcategory,
    setPage,
    setSelectedCategory,
    setSelectedSubcategory,
  } = useStore();

  const [page, setPageNumber] = useState(1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("-createdAt");

  useEffect(() => {
    if (!categories.length) void fetchTaxonomy().catch(() => undefined);
  }, [categories.length, fetchTaxonomy]);

  const selection = useMemo(() => {
    const needle = String(selectedSubcategorySlug || "").trim().toLowerCase();
    for (const category of categories) {
      const subcategory = (category.subcategories || []).find((item) =>
        [item.slug, item.id, item.label]
          .filter(Boolean)
          .some((value) => String(value).trim().toLowerCase() === needle),
      );
      if (subcategory) return { category, subcategory };
    }
    return null;
  }, [categories, selectedSubcategorySlug]);

  useEffect(() => {
    setPageNumber(1);
    setQuery("");
  }, [selectedSubcategorySlug]);

  useEffect(() => {
    if (!selection?.subcategory) return;
    const timer = window.setTimeout(() => {
      void fetchProducts({
        subcategoryRef: selection.subcategory.id,
        keyword: query.trim() || undefined,
        sort,
        page,
        limit: 12,
      }).catch(() => undefined);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [selection, query, sort, page, fetchProducts]);

  const backToCategories = () => {
    if (selection?.category) {
      setSelectedCategory(selection.category.label);
      setSelectedSubcategory("All");
    }
    setPage("categories");
  };

  if (!selection && !catalogLoading) {
    return (
      <div className="min-h-[70vh] bg-gray-50 px-4 py-20 text-center dark:bg-gray-950">
        <p className="text-xl font-bold text-gray-900 dark:text-white">Subcategory not found</p>
        <button type="button" onClick={() => setPage("categories")} className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Back to Categories</button>
      </div>
    );
  }

  const siblings = selection?.category?.subcategories || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <button type="button" onClick={backToCategories} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-violet-700 dark:text-gray-300 dark:hover:text-violet-300">
            <ArrowLeft size={17} />
            Categories
          </button>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">{selection?.category?.label || "Category"}</p>
              <h1 className="mt-1 text-2xl font-black text-gray-900 dark:text-white sm:text-3xl">{selection?.subcategory?.label || "Products"}</h1>
              {selection?.subcategory?.description && <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{selection.subcategory.description}</p>}
            </div>
            {selection?.subcategory?.image && <img src={selection.subcategory.image} alt="" className="hidden h-20 w-20 rounded-2xl object-cover shadow-sm sm:block" />}
          </div>
        </div>
      </div>

      <div className="sticky top-16 z-30 border-b border-gray-100 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {siblings.map((subcategory) => {
              const active = subcategory.id === selection?.subcategory?.id;
              return (
                <button
                  type="button"
                  key={subcategory.id}
                  onClick={() => openSubcategory(subcategory.slug || subcategory.id)}
                  className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition ${active ? "border-violet-600 bg-violet-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-violet-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"}`}
                >
                  {subcategory.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search in ${selection?.subcategory?.label || "subcategory"}...`}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-violet-950"
              />
            </div>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <option value="-createdAt">Newest</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-ratings">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{productMeta.productCount} products</p>
          <p className="text-xs text-gray-500">Page {productMeta.currentPage || page} of {Math.max(productMeta.totalPages || 1, 1)}</p>
        </div>

        {catalogError && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{catalogError}</div>}

        {catalogLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading products…</div>
        ) : products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="font-semibold text-gray-900 dark:text-gray-100">No products in this subcategory yet.</p>
            <p className="mt-1 text-sm text-gray-500">Try another subcategory from the chips above.</p>
          </div>
        )}

        {productMeta.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPageNumber((current) => Math.max(1, current - 1))} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900">Previous</button>
            <span className="px-3 text-sm text-gray-500">{page} / {productMeta.totalPages}</span>
            <button type="button" disabled={page >= productMeta.totalPages} onClick={() => setPageNumber((current) => Math.min(productMeta.totalPages, current + 1))} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
