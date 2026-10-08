import { useRef, useState } from "react";
import {
  Check,
  Eye,
  Heart,
  LoaderCircle,
  RotateCcw,
  ShoppingBag,
  Star,
} from "lucide-react";
import { useStore } from "@/lib/store";

export function flyProductToCart(source) {
  if (!source || typeof document === "undefined") return;
  const target = document.querySelector("[data-cart-dock]");
  const start = source.getBoundingClientRect();
  const end = target?.getBoundingClientRect() || {
    left: window.innerWidth - 118,
    top: window.innerHeight - 82,
    width: 54,
    height: 54,
  };
  const clone = source.cloneNode(true);
  clone.className = "cart-flight";
  clone.style.left = `${start.left}px`;
  clone.style.top = `${start.top}px`;
  clone.style.width = `${Math.min(start.width, 240)}px`;
  clone.style.height = `${Math.min(start.height, 240)}px`;
  clone.style.setProperty(
    "--cart-dx",
    `${end.left + end.width / 2 - (start.left + Math.min(start.width, 240) / 2)}px`,
  );
  clone.style.setProperty(
    "--cart-dy",
    `${end.top + end.height / 2 - (start.top + Math.min(start.height, 240) / 2)}px`,
  );
  document.body.appendChild(clone);
  window.setTimeout(() => clone.remove(), 760);
}

export function Rating({ rating = 0 }) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return (
    <div className="rating" aria-label={`${rounded} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={13} className={i < rounded ? "" : "muted-star"} />
      ))}
    </div>
  );
}

export default function ProductCard({ product, variant = "grid" }) {
  const { setPage, addToCart, toggleWishlist, wishlist } = useStore();
  const isWishlisted = wishlist.some((p) => p.id === product.id);
  const imageRef = useRef(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

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
      window.setTimeout(() => setAdded(false), 1650);
    } finally {
      setAdding(false);
    }
  }

  if (variant === "list") {
    return (
      <article
        className={`mini-product ${added ? "cart-added" : ""}`}
        onClick={() => setPage("product", product.id)}
      >
        <img ref={imageRef} src={product.image} alt={product.name} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3>{product.name}</h3>
          <p>{product.brand || product.category}</p>
          <div>
            <b>₹{product.price}</b>
            {product.originalPrice > product.price && (
              <del>₹{product.originalPrice}</del>
            )}
          </div>
        </div>
        <button
          className={`card-add-button ${added ? "added" : ""}`}
          onClick={add}
          disabled={adding}
          aria-label="Add to cart"
        >
          {adding ? (
            <LoaderCircle size={16} className="sv-spin-icon" />
          ) : added ? (
            <Check size={16} />
          ) : (
            <ShoppingBag size={16} />
          )}
        </button>
      </article>
    );
  }

  const hoverImage = product.images?.[1] || product.image;
  return (
    <article
      className={`product-card reveal-card ${added ? "cart-added" : ""} ${adding ? "cart-adding" : ""}`}
      onClick={() => setPage("product", product.id)}
    >
      <div className="product-media">
        {product.discount > 0 && (
          <span className="product-badge">-{product.discount}%</span>
        )}
        {product.isNew && !product.discount && (
          <span className="product-badge">New</span>
        )}
        <img
          ref={imageRef}
          className="product-img primary"
          src={product.image}
          alt={product.name}
        />
        <img className="product-img hover" src={hoverImage} alt="" />
        <div className="product-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              void toggleWishlist(product);
            }}
            className={isWishlisted ? "selected" : ""}
            aria-label="Wishlist"
          >
            <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("product", product.id);
            }}
            aria-label="View"
          >
            <Eye size={17} />
          </button>
          <button onClick={(e) => e.stopPropagation()} aria-label="Compare">
            <RotateCcw size={17} />
          </button>
          <button
            onClick={add}
            disabled={adding}
            className={added ? "selected cart-action-added" : ""}
            aria-label="Add to cart"
          >
            {adding ? (
              <LoaderCircle size={17} className="sv-spin-icon" />
            ) : added ? (
              <Check size={17} />
            ) : (
              <ShoppingBag size={17} />
            )}
          </button>
        </div>
      </div>
      <div className="product-detail">
        <p className="product-category">{product.brand || product.category}</p>
        <h3>{product.name}</h3>
        <Rating rating={product.rating} />
        <div className="price-row">
          <b>₹{product.price}</b>
          {product.originalPrice > product.price && (
            <del>₹{product.originalPrice}</del>
          )}
        </div>
        <button
          className={`card-add-button ${added ? "added" : ""} ${adding ? "adding" : ""}`}
          onClick={add}
          disabled={adding}
        >
          {adding ? (
            <>
              <LoaderCircle size={15} className="sv-spin-icon" />
              <span>Adding…</span>
            </>
          ) : added ? (
            <>
              <Check size={15} />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingBag size={15} />
              <span>Add to cart</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
