import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import ProductCard from "@/components/product/ProductCard";

export default function SubcategoryProductsScreen() {
  const {
    selectedSubcategorySlug, categories, products, productMeta, catalogLoading, catalogError,
    fetchTaxonomy, fetchProducts, openSubcategory, setPage, setSelectedCategory, setSelectedSubcategory,
  } = useStore();

  const [page, setPageNumber] = useState(1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("-createdAt");

  useEffect(() => { if (!categories.length) void fetchTaxonomy().catch(() => undefined); }, [categories.length, fetchTaxonomy]);

  const selection = useMemo(() => {
    const needle = String(selectedSubcategorySlug || "").trim().toLowerCase();
    for (const category of categories) {
      const subcategory = (category.subcategories || []).find((item) => [item.slug, item.id, item.label].filter(Boolean).some((value) => String(value).trim().toLowerCase() === needle));
      if (subcategory) return { category, subcategory };
    }
    return null;
  }, [categories, selectedSubcategorySlug]);

  useEffect(() => { setPageNumber(1); setQuery(""); }, [selectedSubcategorySlug]);

  useEffect(() => {
    if (!selection?.subcategory) return;
    const timer = window.setTimeout(() => {
      void fetchProducts({ subcategoryRef: selection.subcategory.id, keyword: query.trim() || undefined, sort, page, limit: 12 }).catch(() => undefined);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [selection, query, sort, page, fetchProducts]);

  const backToCategories = () => {
    if (selection?.category) { setSelectedCategory(selection.category.label); setSelectedSubcategory("All"); }
    setPage("categories");
  };

  if (!selection && !catalogLoading) return <div className="premium-empty-page"><h2>Subcategory not found</h2><button className="premium-inline-action" onClick={() => setPage("categories")}>Back to categories</button></div>;

  const siblings = selection?.category?.subcategories || [];
  return <div className="premium-subcategory-page">
    <div className="premium-page-shell">
      <button className="premium-back-link" onClick={backToCategories}><ArrowLeft size={17}/> Categories</button>

      <section className="premium-subcategory-hero">
        <div><span>{selection?.category?.label || "CATEGORY"}</span><h1>{selection?.subcategory?.label || "Products"}</h1><p>{selection?.subcategory?.description || `Discover products from ${selection?.subcategory?.label || "this collection"}.`}</p></div>
        {selection?.subcategory?.image && <img src={selection.subcategory.image} alt=""/>}
      </section>

      <div className="premium-subcategory-tabs">
        {siblings.map((subcategory) => <button key={subcategory.id} className={subcategory.id === selection?.subcategory?.id ? "active" : ""} onClick={() => openSubcategory(subcategory.slug || subcategory.id)}>{subcategory.label}</button>)}
      </div>

      <section className="premium-subcategory-toolbar">
        <label><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search in ${selection?.subcategory?.label || "subcategory"}...`}/></label>
        <div><SlidersHorizontal size={16}/><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="-createdAt">Newest</option><option value="price">Price: Low to High</option><option value="-price">Price: High to Low</option><option value="-ratings">Top Rated</option></select></div>
      </section>

      <div className="catalog-results-head"><div><span>Products</span><small>{productMeta.productCount} products</small></div><small>Page {productMeta.currentPage || page} of {Math.max(productMeta.totalPages || 1, 1)}</small></div>
      {catalogError && <div className="premium-api-error">{catalogError}</div>}
      {catalogLoading ? <div className="premium-loading-state">Loading products…</div> : products.length ? <div className="catalog-products-grid">{products.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="premium-no-results">No products in this subcategory yet.</div>}

      {productMeta.totalPages > 1 && <div className="premium-pagination"><button disabled={page <= 1} onClick={() => setPageNumber((value) => Math.max(1, value - 1))}>Previous</button><span>{page} / {productMeta.totalPages}</span><button disabled={page >= productMeta.totalPages} onClick={() => setPageNumber((value) => Math.min(productMeta.totalPages, value + 1))}>Next</button></div>}
    </div>
  </div>;
}
