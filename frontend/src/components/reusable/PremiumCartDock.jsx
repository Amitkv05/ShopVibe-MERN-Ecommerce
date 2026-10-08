import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useStore } from "@/lib/store";

const AUTO_HIDE_MS = 3600;

export default function PremiumCartDock() {
  const { cart, setPage } = useStore();
  const [visible, setVisible] = useState(false);
  const [bump, setBump] = useState(false);
  const timerRef = useRef(null);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const last = cart[cart.length - 1];

  useEffect(() => {
    const hideLater = () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    };

    const onAdded = () => {
      setVisible(true);
      setBump(true);
      window.setTimeout(() => setBump(false), 520);
      hideLater();
    };

    window.addEventListener("shopvibe:cart-added", onAdded);
    return () => {
      window.removeEventListener("shopvibe:cart-added", onAdded);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!count || !visible) return null;

  return <div className={`cart-dock cart-dock-toast ${bump ? "bump" : ""}`} data-cart-dock>
    <button
      className="cart-pill"
      onClick={() => {
        setVisible(false);
        setPage("cart");
      }}
      onMouseEnter={() => window.clearTimeout(timerRef.current)}
      onMouseLeave={() => {
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setVisible(false), 1800);
      }}
      aria-label="View cart"
    >
      <span className="cart-pill-thumb">
        {last?.product?.image ? <img src={last.product.image} alt=""/> : <ShoppingBag size={18}/>} 
      </span>
      <span className="cart-pill-copy"><b>Added to cart</b><small>{count} {count === 1 ? "item" : "items"} · View cart</small></span>
      <span className="cart-pill-arrow">›</span>
    </button>
  </div>;
}
