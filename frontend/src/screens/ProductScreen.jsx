import { useEffect, useState } from "react";
import { Heart, ShoppingBag, Share2, Star, ChevronLeft, ChevronRight, Truck, Shield, RotateCcw, CheckCircle, Minus, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { adaptProduct, getVariantSku } from "@/lib/data";
import ProductCard from "@/components/product/ProductCard";
import StarRating from "@/components/reusable/StarRating";
import Button from "@/components/reusable/Button";
import Badge from "@/components/reusable/Badge";
export default function ProductScreen() {
    const { selectedProductId, selectedProduct, products, setPage, setSelectedCategory, openSubcategory, addToCart, toggleWishlist, wishlist, fetchProduct, fetchCatalog, isLoggedIn, showToast } = useStore();
    const product = selectedProduct?.id === selectedProductId ? selectedProduct : products.find((p) => p.id === selectedProductId) || null;
    useEffect(() => { if (selectedProductId && (!product || product.id !== selectedProductId))
        void fetchProduct(selectedProductId); }, [selectedProductId, product, fetchProduct]);
    useEffect(() => { if (!products.length)
        void fetchCatalog(); }, [products.length, fetchCatalog]);
    const [selectedSize, setSelectedSize] = useState(product?.sizes[0] ?? "");
    const [selectedColor, setSelectedColor] = useState(product?.colors[0] ?? "");
    const [qty, setQty] = useState(1);
    const [imgIdx, setImgIdx] = useState(0);
    const [activeTab, setActiveTab] = useState("desc");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewBusy, setReviewBusy] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);
    useEffect(() => {
        if (!selectedProductId) return;
        let cancelled = false;
        api(`/products/${encodeURIComponent(selectedProductId)}/related?limit=4`)
            .then((data) => { if (!cancelled) setRelatedProducts((data.relatedProducts || []).map(adaptProduct)); })
            .catch(() => { if (!cancelled) setRelatedProducts([]); });
        return () => { cancelled = true; };
    }, [selectedProductId]);
    useEffect(() => { if (product) {
        setSelectedSize(product.sizes[0] || "Standard");
        setSelectedColor(product.colors[0] || "Default");
        setImgIdx(0);
    } }, [product?.id]);
    if (!product) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-4">Product not found</p>
          <Button onClick={() => setPage("shop")}>Back to Shop</Button>
        </div>
      </div>);
    }
    const isWishlisted = wishlist.some((p) => p.id === product.id);
    const related = relatedProducts.length ? relatedProducts : products.filter((p) => p.id !== product.id && (product.subcategory ? p.subcategory === product.subcategory : p.category === product.category)).slice(0, 4);
    const selectedSku = getVariantSku(product, selectedSize, selectedColor);
    const selectedVariant = product.variants.find((variant) => variant.sku === selectedSku);
    const currentStock = selectedVariant ? Number(selectedVariant.stock || 0) : Number(product.stock || 0);
    const mockReviews = (product.raw?.reviews || []).map((review) => ({ name: review.name || "Customer", rating: Number(review.rating || 0), comment: review.comment || "", date: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "", verified: true }));
    const submitReview = async () => {
        if (!isLoggedIn) {
            showToast("Sign in to write a review", "info");
            setPage("login");
            return;
        }
        if (!reviewComment.trim()) {
            showToast("Please write a review comment", "error");
            return;
        }
        setReviewBusy(true);
        try {
            await api("/review", { method: "PUT", body: { productId: product.id, rating: reviewRating, comment: reviewComment.trim() } });
            setReviewComment("");
            showToast("Review saved", "success");
            await fetchProduct(product.id);
        }
        catch (error) {
            showToast(error instanceof Error ? error.message : "Unable to save review", "error");
        }
        finally {
            setReviewBusy(false);
        }
    };
    return (<div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => setPage("home")} className="hover:text-violet-600 transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => setPage("shop")} className="hover:text-violet-600 transition-colors">Shop</button>
          <span>/</span>
          <button onClick={() => { setSelectedCategory(product.category); setPage("categories"); }} className="hover:text-violet-600 transition-colors">{product.category}</button>
          {product.subcategory && (<>
            <span>/</span>
            <button onClick={() => openSubcategory(product.subcategory)} className="hover:text-violet-600 transition-colors">{product.subcategory}</button>
          </>)}
          <span>/</span>
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-3xl overflow-hidden aspect-square border border-gray-100">
              <img src={product.images[imgIdx]} alt={product.name} className="w-full h-full object-cover"/>
              {product.images.length > 1 && (<>
                  <button onClick={() => setImgIdx((i) => (i - 1 + product.images.length) % product.images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur text-gray-700 flex items-center justify-center hover:bg-white shadow-md transition-all">
                    <ChevronLeft size={20}/>
                  </button>
                  <button onClick={() => setImgIdx((i) => (i + 1) % product.images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur text-gray-700 flex items-center justify-center hover:bg-white shadow-md transition-all">
                    <ChevronRight size={20}/>
                  </button>
                </>)}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && <Badge variant="success">New</Badge>}
                {product.isTrending && <Badge variant="warning">🔥 Trending</Badge>}
                {product.discount > 0 && <Badge variant="danger">-{product.discount}%</Badge>}
              </div>
            </div>
            {product.images.length > 1 && (<div className="flex gap-3">
                {product.images.map((img, i) => (<button key={i} onClick={() => setImgIdx(i)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? "border-violet-500 shadow-md shadow-violet-100" : "border-gray-200 hover:border-gray-400"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover"/>
                  </button>))}
              </div>)}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-violet-600 font-semibold uppercase tracking-wider">{product.brand}</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleWishlist(product)} className={`p-2.5 rounded-xl border transition-all ${isWishlisted ? "border-rose-300 bg-rose-50 text-rose-500" : "border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-500"}`}>
                    <Heart size={20} fill={isWishlisted ? "currentColor" : "none"}/>
                  </button>
                  <button className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:border-gray-400 transition-all">
                    <Share2 size={20}/>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <StarRating rating={product.rating} showValue reviews={product.reviews}/>
                <span className="text-sm text-gray-400">|</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${currentStock > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  <CheckCircle size={14}/> {currentStock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 bg-white rounded-2xl p-4 border border-gray-100">
              <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
              {product.originalPrice > product.price && (<>
                  <span className="text-xl text-gray-400 line-through">₹{product.originalPrice}</span>
                  <Badge variant="danger">Save {product.discount}%</Badge>
                </>)}
            </div>

            {/* Colors */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">
                Color: <span className="font-normal text-gray-600">{selectedColor}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((color) => (<button key={color} onClick={() => setSelectedColor(color)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedColor === color
                ? "border-violet-500 bg-violet-50 text-violet-700"
                : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>
                    {color}
                  </button>))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">
                  Size: <span className="font-normal text-gray-600">{selectedSize}</span>
                </p>
                <button className="text-sm text-violet-600 hover:underline">Size guide</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size) => (<button key={size} onClick={() => setSelectedSize(size)} className={`w-12 h-12 rounded-xl text-sm font-semibold border transition-all ${selectedSize === size
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600"}`}>
                    {size}
                  </button>))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                    <Minus size={16}/>
                  </button>
                  <span className="w-12 text-center text-sm font-semibold text-gray-900">{qty}</span>
                  <button onClick={() => setQty(Math.min(Math.max(currentStock, 1), qty + 1))} disabled={currentStock <= 0 || qty >= currentStock} className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">
                    <Plus size={16}/>
                  </button>
                </div>
                <span className="text-sm text-gray-500">{currentStock > 0 ? `${currentStock} available` : "Currently unavailable"}</span>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3">
              <Button onClick={() => addToCart(product, selectedSize, selectedColor, qty)} size="lg" className="flex-1" icon={<ShoppingBag size={20}/>} disabled={currentStock <= 0}>
                Add to Cart
              </Button>
              <Button onClick={() => { void addToCart(product, selectedSize, selectedColor, qty).then(() => setPage("checkout")); }} size="lg" variant="secondary" className="flex-1" disabled={currentStock <= 0}>
                Buy Now
              </Button>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-3">
              {[
            { icon: <Truck size={16}/>, label: "Shipping", sub: "Calculated by server" },
            { icon: <RotateCcw size={16}/>, label: "30-Day Returns", sub: "Easy returns" },
            { icon: <Shield size={16}/>, label: "Secure Pay", sub: "100% safe" },
        ].map((item) => (<div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-violet-600 flex justify-center mb-1">{item.icon}</div>
                  <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                  <p className="text-[11px] text-gray-500">{item.sub}</p>
                </div>))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {["desc", "specs", "reviews"].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-sm font-semibold transition-colors capitalize ${activeTab === tab ? "text-violet-700 border-b-2 border-violet-600" : "text-gray-500 hover:text-gray-700"}`}>
                {tab === "desc" ? "Description" : tab === "specs" ? "Specifications" : `Reviews (${product.reviews})`}
              </button>))}
          </div>

          <div className="p-6">
            {activeTab === "desc" && (<div>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (<span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">
                      #{tag}
                    </span>))}
                </div>
              </div>)}
            {activeTab === "specs" && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                { label: "Category", value: product.category },
                { label: "Brand", value: product.brand },
                { label: "Available Sizes", value: product.sizes.join(", ") },
                { label: "Colors", value: product.colors.join(", ") },
                { label: "Rating", value: `${product.rating}/5 (${product.reviews} reviews)` },
                { label: "SKU", value: `SKU-${product.id.toString().padStart(5, "0")}` },
            ].map((spec) => (<div key={spec.label} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">{spec.label}</span>
                    <span className="text-sm font-medium text-gray-900">{spec.value}</span>
                  </div>))}
              </div>)}
            {activeTab === "reviews" && (<div className="space-y-6">
                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{product.rating}</div>
                    <StarRating rating={product.rating} className="mt-1 justify-center"/>
                    <p className="text-xs text-gray-500 mt-1">{product.reviews.toLocaleString()} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((r) => (<div key={r} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-4">{r}</span>
                        <Star size={12} className="text-amber-400 fill-amber-400 shrink-0"/>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${r === 5 ? 60 : r === 4 ? 25 : r === 3 ? 10 : r === 2 ? 3 : 2}%` }}/>
                        </div>
                        <span className="text-xs text-gray-400 w-6">
                          {r === 5 ? "60%" : r === 4 ? "25%" : r === 3 ? "10%" : r === 2 ? "3%" : "2%"}
                        </span>
                      </div>))}
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-violet-100 bg-violet-50/40">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div><p className="text-sm font-semibold text-gray-900">Write a review</p><p className="text-xs text-gray-500">Sign in is required to submit.</p></div>
                    <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm">{[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} star{r === 1 ? "" : "s"}</option>)}</select>
                  </div>
                  <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} maxLength={1000} placeholder="Share your experience..." className="w-full min-h-24 p-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-violet-400"/>
                  <div className="mt-3 flex justify-end"><Button size="sm" loading={reviewBusy} onClick={submitReview}>Submit Review</Button></div>
                </div>
                {mockReviews.map((review) => (<div key={review.name} className="pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                            {review.verified && (<span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                                <CheckCircle size={10}/> Verified
                              </span>)}
                          </div>
                          <p className="text-xs text-gray-400">{review.date}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={12}/>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>))}
              </div>)}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (<section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p}/>)}
            </div>
          </section>)}
      </div>
    </div>);
}
