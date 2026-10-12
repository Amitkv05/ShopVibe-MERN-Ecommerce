import { useEffect, useRef, useState } from "react";
import {
  Check,
  Eye,
  Heart,
  LoaderCircle,
  ShoppingBag,
  Star,
} from "lucide-react";
import { useStore } from "@/lib/store";
import "../../styles/ProductCard.css";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Preserve the existing cart-dock animation API used by the detail page. */
export function flyProductToCart(source) {
  if (
    !source ||
    typeof document === "undefined" ||
    typeof window === "undefined"
  )
    return;
  const dock = document.querySelector("[data-cart-dock]");
  const start = source.getBoundingClientRect();
  const end = dock?.getBoundingClientRect() || {
    left: window.innerWidth - 96,
    top: window.innerHeight - 78,
    width: 44,
    height: 44,
  };
  const width = Math.min(start.width, 180);
  const height = Math.min(start.height, 180);
  const startX = start.left + (start.width - width) / 2;
  const startY = start.top + (start.height - height) / 2;
  const clone = source.cloneNode(true);
  clone.className = "svpc-cart-flight";
  clone.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, {
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${width}px`,
    height: `${height}px`,
  });
  clone.style.setProperty(
    "--svpc-flight-x",
    `${end.left + end.width / 2 - (startX + width / 2)}px`,
  );
  clone.style.setProperty(
    "--svpc-flight-y",
    `${end.top + end.height / 2 - (startY + height / 2)}px`,
  );
  document.body.appendChild(clone);
  window.setTimeout(() => clone.remove(), 760);
}

export function Rating({ rating = 0 }) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <div className="svpc-rating" aria-label={`${rounded} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={14}
          fill={index < rounded ? "currentColor" : "none"}
          className={index < rounded ? "is-filled" : ""}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function SafeProductImage({ src, alt, imageRef, className = "" }) {
  const [error, setError] = useState(false);
  useEffect(() => setError(false), [src]);
  if (!src || error) {
    return (
      <div
        className={`svpc-image-fallback ${className}`}
        role="img"
        aria-label={alt}
      >
        <ShoppingBag size={34} />
        <span>Image unavailable</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      ref={imageRef}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}

export default function ProductCard({ product, variant = "grid" }) {
  const { setPage, addToCart, toggleWishlist, wishlist, showToast } =
    useStore();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const imageRef = useRef(null);
  const timerRef = useRef(null);
  const isWishlisted = (Array.isArray(wishlist) ? wishlist : []).some(
    (item) => item.id === product.id,
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  function viewProduct() {
    setPage("product", product.id);
  }

  async function add(event) {
    event?.stopPropagation();
    if (adding) return;
    setAdding(true);
    setAdded(false);
    try {
      await addToCart(
        product,
        product.sizes?.[0] || "Standard",
        product.colors?.[0] || "Default",
      );
      flyProductToCart(imageRef.current);
      setAdded(true);
      window.dispatchEvent(
        new window.CustomEvent("shopvibe:cart-added", {
          detail: { productId: product.id },
        }),
      );
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setAdded(false), 1650);
    } catch (error) {
      showToast?.(
        error instanceof Error ? error.message : "Unable to add to cart",
        "error",
      );
    } finally {
      setAdding(false);
    }
  }

  function handleCardKey(event) {
    if (
      event.target === event.currentTarget &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      viewProduct();
    }
  }

  if (variant === "list") {
    return (
      <article
        className={`svpc-mini ${added ? "is-added" : ""}`}
        onClick={viewProduct}
        onKeyDown={handleCardKey}
        tabIndex={0}
        aria-label={`View ${product.name}`}
      >
        <div className="svpc-mini-media">
          <SafeProductImage
            src={product.image}
            alt={product.name}
            imageRef={imageRef}
          />
        </div>
        <div className="svpc-mini-content">
          <h3>{product.name}</h3>
          <p>{product.brand || product.category}</p>
          <div className="svpc-mini-price">
            <strong>{money(product.price)}</strong>
            {Number(product.originalPrice) > Number(product.price) && (
              <del>{money(product.originalPrice)}</del>
            )}
          </div>
        </div>
        <button
          type="button"
          className={`svpc-mini-add ${added ? "is-added" : ""}`}
          onClick={add}
          disabled={adding}
          aria-label={`Add ${product.name} to cart`}
        >
          {adding ? (
            <LoaderCircle size={18} className="svpc-spin" />
          ) : added ? (
            <Check size={18} />
          ) : (
            <ShoppingBag size={18} />
          )}
        </button>
      </article>
    );
  }

  const hoverImage = product.images?.[1] || product.image;
  return (
    <article
      className={`svpc-card ${added ? "is-added" : ""} ${adding ? "is-adding" : ""}`}
      onClick={viewProduct}
      onKeyDown={handleCardKey}
      tabIndex={0}
      aria-label={`View ${product.name}`}
    >
      <div className="svpc-media">
        <div className="svpc-badges">
          {Number(product.discount) > 0 ? (
            <span className="svpc-badge">-{product.discount}%</span>
          ) : product.isNew ? (
            <span className="svpc-badge">NEW</span>
          ) : null}
          {product.isTrending && (
            <span className="svpc-badge svpc-badge-outline">POPULAR</span>
          )}
        </div>
        <SafeProductImage
          src={product.image}
          alt={product.name}
          className="svpc-primary-image"
          imageRef={imageRef}
        />
        {hoverImage && hoverImage !== product.image && (
          <img
            className="svpc-hover-image"
            src={hoverImage}
            alt=""
            loading="lazy"
          />
        )}
        <div className="svpc-actions">
          <button
            type="button"
            className={isWishlisted ? "is-selected" : ""}
            onClick={(event) => {
              event.stopPropagation();
              void toggleWishlist(product);
            }}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
            aria-pressed={isWishlisted}
          >
            <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              viewProduct();
            }}
            aria-label="View product details"
          >
            <Eye size={17} />
          </button>
          <button
            type="button"
            onClick={add}
            disabled={adding}
            aria-label="Quick add to cart"
          >
            {adding ? (
              <LoaderCircle size={17} className="svpc-spin" />
            ) : added ? (
              <Check size={17} />
            ) : (
              <ShoppingBag size={17} />
            )}
          </button>
        </div>
      </div>
      <div className="svpc-content">
        <span className="svpc-category">
          {product.brand || product.category}
        </span>
        <h3>{product.name}</h3>
        <Rating rating={product.rating} />
        <div className="svpc-price">
          <strong>{money(product.price)}</strong>
          {Number(product.originalPrice) > Number(product.price) && (
            <del>{money(product.originalPrice)}</del>
          )}
        </div>
        <button
          type="button"
          className={`svpc-add ${added ? "is-added" : ""}`}
          onClick={add}
          disabled={adding}
        >
          {adding ? (
            <LoaderCircle size={16} className="svpc-spin" />
          ) : added ? (
            <Check size={16} />
          ) : (
            <ShoppingBag size={16} />
          )}
          <span>
            {adding ? "Adding..." : added ? "Added to cart" : "Add to Cart"}
          </span>
        </button>
      </div>
    </article>
  );
}
