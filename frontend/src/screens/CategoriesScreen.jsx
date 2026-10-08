import { useEffect, useMemo, useState } from "react";
import { Grid3X3, List, Search, SlidersHorizontal, X, ArrowRight, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import ProductCard from "@/components/product/ProductCard";

const SORT_MAP = { featured: "-createdAt", "price-asc": "price", "price-desc": "-price", rating: "-ratings", newest: "-createdAt" };

export default function CategoriesScreen({ mode = "shop" }) {
  const {
    selectedCategory, setSelectedCategory, selectedSubcategory, setSelectedSubcategory,
    searchQuery, setSearchQuery, sortBy, setSortBy, priceRange, setPriceRange,
    products, categories, fetchCatalog, fetchProducts, productMeta, catalogLoading,
    catalogError, openSubcategory,
  } = useStore();

  const [viewMode, setViewMode] = useState("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [page, setPageNumber] = useState(1);

  useEffect(() => { if (!categories.length) void fetchCatalog(); }, [fetchCatalog, categories.length]);

  const selectedCategoryRecord = useMemo(() => {
    if (selectedCategory === "All") return null;
    const key = String(selectedCategory || "").trim().toLowerCase();
    return categories.find((category) => [category.id, category.label, category.slug].filter(Boolean).some((value) => String(value).trim().toLowerCase() === key)) || null;
  }, [categories, selectedCategory]);

  const subcategories = selectedCategoryRecord?.subcategories || [];
  const selectedSubcategoryRecord = useMemo(() => {
    if (selectedSubcategory === "All") return null;
    const key = String(selectedSubcategory || "").trim().toLowerCase();
    return subcategories.find((item) => [item.id, item.label, item.slug].filter(Boolean).some((value) => String(value).trim().toLowerCase() === key)) || null;
  }, [subcategories, selectedSubcategory]);

  const chooseCategory = (category) => {
    setSelectedCategory(category?.label || "All");
    setSelectedSubcategory("All");
    setPageNumber(1);
  };

  useEffect(() => {
    if (mode === "categories") return undefined;
    const timer = window.setTimeout(() => {
      void fetchProducts({
        keyword: searchQuery.trim() || undefined,
        categoryRef: selectedCategory !== "All" ? selectedCategoryRecord?.id : undefined,
        category: selectedCategory !== "All" && !selectedCategoryRecord ? selectedCategory : undefined,
        subcategoryRef: selectedSubcategory !== "All" ? selectedSubcategoryRecord?.id : undefined,
        subcategory: selectedSubcategory !== "All" && !selectedSubcategoryRecord ? selectedSubcategory : undefined,
        "price[gte]": priceRange[0] > 0 ? priceRange[0] : undefined,
        "price[lte]": priceRange[1] < 100000 ? priceRange[1] : undefined,
        "ratings[gte]": ratingFilter > 0 ? ratingFilter : undefined,
        sort: mode === "newArrivals" ? "-createdAt" : SORT_MAP[sortBy] || "-createdAt",
        page,
        limit: mode === "newArrivals" ? 50 : 12,
      }).catch(() => undefined);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [fetchProducts, mode, selectedCategory, selectedCategoryRecord, selectedSubcategory, selectedSubcategoryRecord, searchQuery, sortBy, priceRange, ratingFilter, page]);

  if (mode === "categories") {
    return <CategoryExplorer categories={categories} active={selectedCategoryRecord || categories[0] || null} chooseCategory={chooseCategory} openSubcategory={openSubcategory} loading={catalogLoading} error={catalogError}/>;
  }

  const displayedProducts = mode === "newArrivals" ? products.filter((product) => product.isNew) : products;
  const resetFilters = () => { setSelectedSubcategory("All"); setRatingFilter(0); setPriceRange([0, 100000]); };

  return <div className="premium-catalog-page">
    <div className="premium-page-shell">
      <header className="premium-page-heading catalog-heading">
        <div><span>LIVE CATALOG</span><h1>{mode === "newArrivals" ? "Latest products" : "Shop"}</h1><p>Browse products directly from your connected ShopVibe API.</p></div>
        <div className="catalog-heading-badge"><Sparkles size={18}/><b>{productMeta.productCount || displayedProducts.length}</b><small>Products</small></div>
      </header>

      <section className="catalog-toolbar-card">
        <div className="catalog-category-strip">
          <button className={selectedCategory === "All" ? "active" : ""} onClick={() => chooseCategory(null)}>All</button>
          {categories.map((category) => <button key={category.id} className={selectedCategoryRecord?.id === category.id ? "active" : ""} onClick={() => chooseCategory(category)}>{category.label}</button>)}
        </div>
        {selectedCategoryRecord && subcategories.length > 0 && <div className="catalog-subcategory-strip">
          <button className={selectedSubcategory === "All" ? "active" : ""} onClick={() => setSelectedSubcategory("All")}>All {selectedCategoryRecord.label}</button>
          {subcategories.map((sub) => <button key={sub.id} className={selectedSubcategoryRecord?.id === sub.id ? "active" : ""} onClick={() => setSelectedSubcategory(sub.label)}>{sub.label}</button>)}
        </div>}
        <div className="catalog-controls">
          <label className="catalog-search"><Search size={17}/><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..."/>{searchQuery && <button onClick={() => setSearchQuery("")}><X size={15}/></button>}</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="rating">Top Rated</option></select>
          <button className={`catalog-filter-toggle ${filterOpen ? "active" : ""}`} onClick={() => setFilterOpen((value) => !value)}><SlidersHorizontal size={17}/> Filters</button>
          <div className="catalog-view-toggle"><button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}><Grid3X3 size={17}/></button><button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}><List size={17}/></button></div>
        </div>
        {filterOpen && <div className="catalog-filter-panel">
          <div><span>Minimum price</span><input type="number" value={priceRange[0]} min="0" onChange={(e) => setPriceRange([Number(e.target.value || 0), priceRange[1]])}/></div>
          <div><span>Maximum price</span><input type="number" value={priceRange[1]} min="0" onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value || 100000)])}/></div>
          <div><span>Minimum rating</span><select value={ratingFilter} onChange={(e) => setRatingFilter(Number(e.target.value))}><option value="0">Any rating</option><option value="3">3+ stars</option><option value="4">4+ stars</option><option value="4.5">4.5+ stars</option></select></div>
          <button onClick={resetFilters}>Reset filters</button>
        </div>}
      </section>

      <div className="catalog-results-head"><div><span>{selectedSubcategoryRecord?.label || selectedCategoryRecord?.label || "All products"}</span><small>{mode === "newArrivals" ? displayedProducts.length : productMeta.productCount} products</small></div><small>Page {productMeta.currentPage || page} of {Math.max(productMeta.totalPages || 1, 1)}</small></div>
      {catalogError && <div className="premium-api-error">{catalogError}</div>}
      {catalogLoading ? <div className="premium-loading-state">Loading products…</div> : displayedProducts.length ? <div className={viewMode === "list" ? "catalog-products-list" : "catalog-products-grid"}>{displayedProducts.map((product) => <ProductCard key={product.id} product={product} variant={viewMode}/>)}</div> : <div className="premium-no-results">No products found. Try another filter.</div>}
      {mode !== "newArrivals" && productMeta.totalPages > 1 && <div className="premium-pagination"><button disabled={page <= 1} onClick={() => setPageNumber((value) => Math.max(1, value - 1))}>Previous</button><span>{page} / {productMeta.totalPages}</span><button disabled={page >= productMeta.totalPages} onClick={() => setPageNumber((value) => Math.min(productMeta.totalPages, value + 1))}>Next</button></div>}
    </div>
  </div>;
}

function CategoryExplorer({ categories, active, chooseCategory, openSubcategory, loading, error }) {
  if (loading && !categories.length) return <div className="premium-loading-state tall">Loading categories…</div>;
  if (error && !categories.length) return <div className="premium-api-error centered">{error}</div>;
  if (!active) return <div className="premium-no-results tall">No categories available.</div>;
  const subcategories = active.subcategories || [];

  return <div className="premium-category-page">
    <div className="premium-page-shell">
      <header className="premium-page-heading"><div><span>CATEGORIES</span><h1>Shop by category</h1><p>Choose a category and continue into its subcategories.</p></div></header>
      <div className="premium-category-layout">
        <aside className="premium-category-sidebar">
          <div className="premium-category-sidebar-title">Browse</div>
          {categories.map((category) => <button key={category.id} className={active.id === category.id ? "active" : ""} onClick={() => chooseCategory(category)}><CategoryThumb category={category}/><span>{category.label}</span><ArrowRight size={15}/></button>)}
        </aside>
        <section className="premium-category-content">
          <div className="premium-category-hero">
            {active.banner ? <img src={active.banner} alt=""/> : <div className="premium-category-hero-fallback"/>}
            <div><span>CATEGORY</span><h2>{active.label}</h2><p>{active.description || `Explore the best products in ${active.label}.`}</p></div>
          </div>
          <div className="premium-section-title"><div><span>{active.label.toUpperCase()}</span><h2>Browse subcategories</h2></div></div>
          {subcategories.length ? <div className="premium-subcategory-grid">{subcategories.map((sub) => <button key={sub.id} onClick={() => openSubcategory(sub.slug || sub.id)}><div>{sub.image ? <img src={sub.image} alt={sub.label}/> : <span>🛍️</span>}</div><b>{sub.label}</b><small>Explore products</small></button>)}</div> : <div className="premium-no-results">No active subcategories in this category yet.</div>}
        </section>
      </div>
    </div>
  </div>;
}

function CategoryThumb({ category }) {
  const value = category.icon || category.image;
  if (typeof value === "string" && /^https?:\/\//.test(value)) return <img src={value} alt=""/>;
  return <span>{value || "🛍️"}</span>;
}
