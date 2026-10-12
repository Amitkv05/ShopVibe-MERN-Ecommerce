import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { adaptProduct, getVariantSku } from "@/lib/data";
import ProductCard, {
  flyProductToCart,
} from "@/components/product/ProductCard";
import NotFoundScreen from "@/screens/NotFoundScreen";
import "../styles/ProductScreen.css";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const toArray = (value) => (Array.isArray(value) ? value : []);

function Stars({ value = 0, size = 15 }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="svp-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={size}
          fill={index + 1 <= Math.round(rating) ? "currentColor" : "none"}
          className={index + 1 <= Math.round(rating) ? "is-filled" : ""}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function ProductImage({ src, alt, imageRef, className = "" }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src || broken) {
    return (
      <div
        className={`svp-image-placeholder ${className}`}
        role="img"
        aria-label={alt}
      >
        <ShoppingBag size={46} strokeWidth={1.3} />
        <span>Image unavailable</span>
      </div>
    );
  }
  return (
    <img
      ref={imageRef}
      className={className}
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

export default function ProductScreen() {
  const {
    selectedProductId,
    selectedProduct,
    products,
    setPage,
    setSelectedCategory,
    openSubcategory,
    addToCart,
    toggleWishlist,
    wishlist,
    fetchProduct,
    fetchCatalog,
    isLoggedIn,
    showToast,
  } = useStore();

  const product =
    selectedProduct?.id === selectedProductId
      ? selectedProduct
      : toArray(products).find((item) => item.id === selectedProductId) || null;

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("desc");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const heroImageRef = useRef(null);
  const addedTimer = useRef(null);

  useEffect(() => {
    if (selectedProductId && (!product || product.id !== selectedProductId)) {
      void fetchProduct(selectedProductId);
    }
  }, [selectedProductId, product, fetchProduct]);

  useEffect(() => {
    if (!toArray(products).length) void fetchCatalog();
  }, [products?.length, fetchCatalog]);

  useEffect(() => {
    if (!selectedProductId) return;
    let cancelled = false;
    setRelatedProducts([]);
    api(`/products/${encodeURIComponent(selectedProductId)}/related?limit=4`)
      .then((data) => {
        if (!cancelled)
          setRelatedProducts(toArray(data?.relatedProducts).map(adaptProduct));
      })
      .catch(() => {
        if (!cancelled) setRelatedProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProductId]);

  useEffect(() => {
    if (!product) return;
    setSelectedSize(toArray(product.sizes)[0] || "Standard");
    setSelectedColor(toArray(product.colors)[0] || "Default");
    setImgIdx(0);
    setQty(1);
    setActiveTab("desc");
    setAddedToCart(false);
    setSizeGuideOpen(false);
  }, [product?.id]);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  if (!product) return <NotFoundScreen />;

  const images = toArray(product.images).filter(Boolean);
  if (!images.length && product.image) images.push(product.image);
  const sizes = toArray(product.sizes);
  const colors = toArray(product.colors);
  const variants = toArray(product.variants);
  const tags = toArray(product.tags);
  const reviews = toArray(product.raw?.reviews).map((review, index) => ({
    id: review._id || review.id || index,
    name: review.name || "Customer",
    rating: Number(review.rating || 0),
    comment: review.comment || "",
    date: review.createdAt
      ? new Date(review.createdAt).toLocaleDateString("en-IN")
      : "",
    verified: Boolean(review.verified || review.isVerifiedPurchase),
  }));
  const related = (
    relatedProducts.length
      ? relatedProducts
      : toArray(products)
          .filter(
            (item) =>
              item.id !== product.id &&
              (product.subcategory
                ? item.subcategory === product.subcategory
                : item.category === product.category),
          )
          .slice(0, 4)
  )
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const isWishlisted = toArray(wishlist).some((item) => item.id === product.id);
  const selectedSku = getVariantSku(product, selectedSize, selectedColor);
  const selectedVariant = variants.find(
    (variant) => variant.sku === selectedSku,
  );
  const currentStock = Math.max(
    0,
    Number(selectedVariant ? selectedVariant.stock || 0 : product.stock || 0),
  );
  const discount = Number(product.discount || 0);
  const originalPrice = Number(product.originalPrice || 0);
  const productPrice = Number(product.price || 0);
  const reviewCount = Number(product.reviews || reviews.length || 0);

  const setImage = (index) =>
    setImgIdx((index + images.length) % images.length);

  async function addSelectedToCart({ buyNow = false } = {}) {
    if (addingToCart || currentStock <= 0) return;
    setAddingToCart(true);
    setAddedToCart(false);
    try {
      await addToCart(product, selectedSize, selectedColor, qty);
      if (buyNow) {
        setPage("checkout");
        return;
      }
      flyProductToCart(heroImageRef.current);
      setAddedToCart(true);
      window.dispatchEvent(
        new window.CustomEvent("shopvibe:cart-added", {
          detail: { productId: product.id },
        }),
      );
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAddedToCart(false), 1700);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to add to cart",
        "error",
      );
    } finally {
      setAddingToCart(false);
    }
  }

  async function submitReview(event) {
    event.preventDefault();
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
      await api("/review", {
        method: "PUT",
        body: {
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        },
      });
      setReviewComment("");
      showToast("Review saved", "success");
      await fetchProduct(product.id);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to save review",
        "error",
      );
    } finally {
      setReviewBusy(false);
    }
  }

  async function shareProduct() {
    const share = { title: product.name, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(share);
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(share.url);
        showToast("Product link copied", "success");
      } else showToast("Copy the page URL from your browser", "info");
    } catch (error) {
      if (error?.name !== "AbortError")
        showToast("Unable to share product", "error");
    }
  }

  return (
    <main className="svp-page">
      <div className="svp-container">
        <nav className="svp-breadcrumb" aria-label="Breadcrumb">
          <button type="button" onClick={() => setPage("home")}>
            Home
          </button>
          <span className="svp-crumb-sep">/</span>
          <button type="button" onClick={() => setPage("shop")}>
            Shop
          </button>
          <span className="svp-crumb-sep">/</span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(product.category);
              setPage("categories");
            }}
          >
            {product.category}
          </button>
          {product.subcategory && (
            <>
              <span className="svp-crumb-sep">/</span>
              <button
                type="button"
                onClick={() => openSubcategory(product.subcategory)}
              >
                {product.subcategory}
              </button>
            </>
          )}
          <span className="svp-crumb-sep">/</span>
          <span className="svp-crumb-current" aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className="svp-product-grid">
          <section className="svp-gallery" aria-label="Product images">
            <div className="svp-gallery-stage">
              <div className="svp-badges">
                {product.isNew && (
                  <span className="svp-badge">NEW ARRIVAL</span>
                )}
                {product.isTrending && (
                  <span className="svp-badge svp-badge-outline">TRENDING</span>
                )}
                {discount > 0 && (
                  <span className="svp-badge svp-badge-sale">
                    -{discount}% OFF
                  </span>
                )}
              </div>
              <ProductImage
                key={images[imgIdx] || product.id}
                src={images[imgIdx]}
                alt={`${product.name} image ${imgIdx + 1}`}
                imageRef={heroImageRef}
                className="svp-hero-image"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="svp-gallery-arrow svp-prev"
                    onClick={() => setImage(imgIdx - 1)}
                    aria-label="Previous product image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="svp-gallery-arrow svp-next"
                    onClick={() => setImage(imgIdx + 1)}
                    aria-label="Next product image"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <span className="svp-gallery-count">
                    {imgIdx + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="svp-thumbnails" aria-label="Choose product image">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={`svp-thumbnail ${imgIdx === index ? "is-active" : ""}`}
                    onClick={() => setImgIdx(index)}
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={imgIdx === index}
                  >
                    <img src={image} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            <div className="svp-gallery-note">
              <ShieldCheck size={16} /> Detailed photos for a confident purchase{" "}
              <span>SHOPVIBE</span>
            </div>
          </section>

          <section
            className="svp-details"
            aria-label="Product purchase options"
          >
            <div className="svp-product-top">
              <div className="svp-product-identification">
                <p className="svp-eyebrow">
                  {product.brand || product.category || "SHOPVIBE COLLECTION"}
                </p>
                <h1>{product.name}</h1>
              </div>
              <div className="svp-icon-actions">
                <button
                  type="button"
                  className={isWishlisted ? "is-active" : ""}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                  aria-pressed={isWishlisted}
                  onClick={() => void toggleWishlist(product)}
                >
                  <Heart
                    size={20}
                    fill={isWishlisted ? "currentColor" : "none"}
                  />
                </button>
                <button
                  type="button"
                  aria-label="Share product"
                  onClick={shareProduct}
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
            <div className="svp-rating-stock">
              <Stars value={product.rating} />
              <span className="svp-rating-text">
                {Number(product.rating || 0).toFixed(1)}{" "}
                <span>({reviewCount} reviews)</span>
              </span>
              <span className="svp-dot-separator" aria-hidden="true" />
              <span
                className={`svp-stock ${currentStock <= 0 ? "is-out" : ""}`}
              >
                <CheckCircle2 size={16} />{" "}
                {currentStock > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <div className="svp-price-card">
              <div className="svp-price-row">
                <strong>{money(productPrice)}</strong>
                {originalPrice > productPrice && (
                  <del>{money(originalPrice)}</del>
                )}
                {discount > 0 && (
                  <span className="svp-savings">Save {discount}%</span>
                )}
              </div>
              <p>
                Inclusive of applicable taxes. Shipping calculated at checkout.
              </p>
            </div>

            {colors.length > 0 && (
              <div className="svp-option-group">
                <div className="svp-option-heading">
                  <strong>Color</strong>
                  <span>{selectedColor}</span>
                </div>
                <div className="svp-choice-list">
                  {colors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={`svp-choice ${selectedColor === color ? "is-selected" : ""}`}
                      onClick={() => {
                        setSelectedColor(color);
                        setQty(1);
                      }}
                      aria-pressed={selectedColor === color}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="svp-option-group">
                <div className="svp-option-heading">
                  <div>
                    <strong>Size / Variant</strong>
                    <span>{selectedSize}</span>
                  </div>
                  <button
                    type="button"
                    className="svp-text-action"
                    onClick={() => setSizeGuideOpen(true)}
                  >
                    Size guide <ArrowLeft size={13} />
                  </button>
                </div>
                <div className="svp-choice-list">
                  {sizes.map((size) => (
                    <button
                      type="button"
                      key={size}
                      className={`svp-choice ${selectedSize === size ? "is-selected" : ""}`}
                      onClick={() => {
                        setSelectedSize(size);
                        setQty(1);
                      }}
                      aria-pressed={selectedSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="svp-option-group svp-quantity-group">
              <div className="svp-option-heading">
                <strong>Quantity</strong>
              </div>
              <div className="svp-quantity-row">
                <div className="svp-quantity-control">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <output aria-live="polite">{qty}</output>
                  <button
                    type="button"
                    onClick={() =>
                      setQty(Math.min(Math.max(currentStock, 1), qty + 1))
                    }
                    disabled={currentStock <= 0 || qty >= currentStock}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="svp-availability">
                  {currentStock > 0
                    ? `${currentStock} available`
                    : "Currently unavailable"}
                </span>
              </div>
            </div>

            <div className="svp-buy-actions">
              <button
                type="button"
                className={`svp-add-button ${addedToCart ? "is-added" : ""}`}
                disabled={addingToCart || currentStock <= 0}
                onClick={() => void addSelectedToCart()}
              >
                {addingToCart ? (
                  <LoaderCircle size={19} className="svp-spin" />
                ) : addedToCart ? (
                  <Check size={19} />
                ) : (
                  <ShoppingBag size={19} />
                )}
                <span>
                  {addingToCart
                    ? "Adding..."
                    : addedToCart
                      ? "Added to cart"
                      : "Add to Cart"}
                </span>
              </button>
              <button
                type="button"
                className="svp-buy-button"
                disabled={addingToCart || currentStock <= 0}
                onClick={() => void addSelectedToCart({ buyNow: true })}
              >
                Buy Now <span>↗</span>
              </button>
            </div>
            <div className="svp-benefits">
              <div>
                <Truck size={21} />
                <strong>Shipping</strong>
                <span>Calculated by server</span>
              </div>
              <div>
                <RotateCcw size={21} />
                <strong>Easy Returns</strong>
                <span>Check return terms</span>
              </div>
              <div>
                <ShieldCheck size={21} />
                <strong>Secure Checkout</strong>
                <span>Protected purchase</span>
              </div>
            </div>
          </section>
        </div>

        <section
          className="svp-tabs-panel"
          aria-label="More product information"
        >
          <div
            className="svp-tabs"
            role="tablist"
            aria-label="Product details tabs"
          >
            {[
              ["desc", "Description"],
              ["specs", "Specifications"],
              ["reviews", `Reviews (${reviewCount})`],
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                id={`svp-tab-${key}`}
                role="tab"
                aria-selected={activeTab === key}
                aria-controls={`svp-panel-${key}`}
                className={activeTab === key ? "is-active" : ""}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="svp-tab-content"
            id={`svp-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`svp-tab-${activeTab}`}
          >
            {activeTab === "desc" && (
              <div className="svp-description">
                <h2>Product overview</h2>
                <p>
                  {product.description ||
                    "No description has been added for this product yet."}
                </p>
                {tags.length > 0 && (
                  <div className="svp-tags">
                    {tags.map((tag, index) => (
                      <span key={`${tag}-${index}`}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "specs" && (
              <div className="svp-specifications">
                <h2>Specifications</h2>
                <dl>
                  {[
                    ["Category", product.category],
                    ["Subcategory", product.subcategory],
                    ["Brand", product.brand],
                    ["Available sizes", sizes.join(", ")],
                    ["Colors", colors.join(", ")],
                    ["SKU", selectedSku || product.sku || "Not specified"],
                    [
                      "Stock",
                      currentStock > 0
                        ? `${currentStock} units`
                        : "Out of stock",
                    ],
                  ]
                    .filter(([, value]) => value != null && value !== "")
                    .map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{String(value)}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="svp-reviews">
                <div className="svp-review-summary">
                  <div>
                    <strong>{Number(product.rating || 0).toFixed(1)}</strong>
                    <Stars value={product.rating} size={17} />
                    <span>{reviewCount} customer reviews</span>
                  </div>
                  <p>
                    Reviews from customers help you make an informed choice.
                  </p>
                </div>
                <form className="svp-review-form" onSubmit={submitReview}>
                  <div className="svp-review-form-head">
                    <div>
                      <h3>Write a review</h3>
                      <p>Sign in to submit your feedback.</p>
                    </div>
                    <label>
                      Rating{" "}
                      <select
                        value={reviewRating}
                        onChange={(e) =>
                          setReviewRating(Number(e.target.value))
                        }
                      >
                        {[5, 4, 3, 2, 1].map((number) => (
                          <option key={number} value={number}>
                            {number} star{number === 1 ? "" : "s"}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    maxLength={1000}
                    placeholder="Share your experience with this product..."
                    aria-label="Review comment"
                  />
                  <div className="svp-review-form-bottom">
                    <span>{reviewComment.length}/1000</span>
                    <button type="submit" disabled={reviewBusy}>
                      {reviewBusy ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </form>
                <div className="svp-review-list">
                  {reviews.length ? (
                    reviews.map((review) => (
                      <article key={review.id} className="svp-review-item">
                        <div className="svp-review-avatar" aria-hidden="true">
                          {String(review.name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="svp-review-item-head">
                            <strong>{review.name}</strong>
                            {review.verified && (
                              <span>
                                <CheckCircle2 size={13} /> Verified
                              </span>
                            )}
                            <small>{review.date}</small>
                          </div>
                          <Stars value={review.rating} size={13} />
                          <p>{review.comment}</p>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="svp-empty-reviews">
                      No reviews yet. Be the first to share your experience.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {related.length > 0 && (
          <section
            className="svp-related"
            aria-labelledby="svp-related-heading"
          >
            <div className="svp-section-heading">
              <div>
                <span>DISCOVER MORE</span>
                <h2 id="svp-related-heading">
                  You may also like<span>.</span>
                </h2>
              </div>
              <button type="button" onClick={() => setPage("shop")}>
                Explore all <ChevronRight size={18} />
              </button>
            </div>
            <div className="svp-related-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {sizeGuideOpen && (
        <div
          className="svp-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSizeGuideOpen(false);
          }}
        >
          <div
            className="svp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="svp-size-guide-title"
          >
            <button
              type="button"
              className="svp-modal-close"
              onClick={() => setSizeGuideOpen(false)}
              aria-label="Close size guide"
            >
              <X size={20} />
            </button>
            <span className="svp-eyebrow">SIZING INFORMATION</span>
            <h2 id="svp-size-guide-title">Available variants</h2>
            <p>
              The seller lists these options for this product. For exact
              dimensions or fit information, check the product description or
              contact the seller before ordering.
            </p>
            <div className="svp-choice-list">
              {sizes.map((size) => (
                <span key={size} className="svp-choice">
                  {size}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="svp-add-button"
              onClick={() => setSizeGuideOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
