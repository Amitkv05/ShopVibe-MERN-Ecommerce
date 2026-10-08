import { useState } from "react";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { api, apiMessage } from "@/lib/api";
import Button from "@/components/reusable/Button";

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function CartScreen() {
  const {
    cart,
    removeFromCart,
    updateQty,
    clearCart,
    setPage,
    isLoggedIn,
    couponCode,
    setCouponCode,
    showToast,
  } = useStore();

  const [coupon, setCoupon] = useState(couponCode || "");
  const [couponApplied, setCouponApplied] = useState(Boolean(couponCode));
  const [discountAmount, setDiscountAmount] = useState(0);
  const [serverTotal, setServerTotal] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = cart.reduce((amount, item) => amount + item.product.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const discount = couponApplied ? discountAmount : 0;
  const total = serverTotal ?? subtotal - discount + shipping;
  const itemCount = cart.reduce((amount, item) => amount + item.quantity, 0);

  const handleCoupon = async () => {
    if (!isLoggedIn) {
      setCouponError("Sign in to validate and use a coupon.");
      return;
    }
    if (!coupon.trim()) {
      setCouponError("Enter a promo code first.");
      return;
    }

    setCouponLoading(true);
    try {
      const orderItems = cart.map((item) => ({
        product: item.product.id,
        quantity: item.quantity,
        variantSku: item.variantSku || "",
      }));
      const data = await api("/coupon/validate", {
        method: "POST",
        body: { couponCode: coupon.trim().toUpperCase(), orderItems },
      });
      setCouponApplied(true);
      setCouponError("");
      setDiscountAmount(Number(data.discountPrice || 0));
      setServerTotal(Number(data.totalPrice || 0));
      setCouponCode(data.couponCode || coupon.trim().toUpperCase());
      showToast("Coupon applied", "success");
    } catch (error) {
      setCouponApplied(false);
      setDiscountAmount(0);
      setServerTotal(null);
      setCouponCode("");
      setCouponError(apiMessage(error, "Invalid coupon"));
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCoupon("");
    setCouponCode("");
    setDiscountAmount(0);
    setServerTotal(null);
    setCouponError("");
  };

  if (!cart.length) {
    return (
      <div className="premium-cart-empty-page">
        <div className="premium-cart-empty-card">
          <span><ShoppingBag size={34} /></span>
          <small>YOUR BAG</small>
          <h1>Your cart is empty</h1>
          <p>Add something you love and it will be waiting for you here.</p>
          <Button onClick={() => setPage("home")} size="lg" iconRight={<ArrowRight size={17} />}>Explore products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-cart-page">
      <div className="premium-cart-shell">
        <header className="premium-cart-heading">
          <div>
            <span>YOUR BAG</span>
            <h1>Shopping cart</h1>
            <p>{itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout</p>
          </div>
          <button type="button" className="premium-cart-clear" onClick={() => void clearCart()}>
            <Trash2 size={15} /> Clear cart
          </button>
        </header>

        <div className="premium-cart-layout">
          <section className="premium-cart-items-card">
            {cart.map((item) => (
              <article className="premium-cart-line" key={`${item.product.id}-${item.variantSku || item.size}-${item.color}`}>
                <button className="premium-cart-product-image" onClick={() => setPage("product", item.product.id)}>
                  <img src={item.product.image} alt={item.product.name} />
                </button>

                <div className="premium-cart-product-copy">
                  <small>{item.product.brand || item.product.category || "ShopVibe"}</small>
                  <button className="premium-cart-product-name" onClick={() => setPage("product", item.product.id)}>{item.product.name}</button>
                  <div className="premium-cart-variants">
                    <span>{item.size || "Standard"}</span>
                    <span>{item.color || "Default"}</span>
                  </div>
                  <div className="premium-cart-line-bottom">
                    <div className="premium-cart-qty">
                      <button
                        onClick={() => item.quantity <= 1
                          ? removeFromCart(item.product.id, item.size, item.color)
                          : updateQty(item.product.id, item.size, item.color, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      ><Minus size={14} /></button>
                      <b>{item.quantity}</b>
                      <button onClick={() => updateQty(item.product.id, item.size, item.color, item.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                    </div>
                    <strong>{money(item.product.price * item.quantity)}</strong>
                  </div>
                </div>

                <button className="premium-cart-remove" onClick={() => removeFromCart(item.product.id, item.size, item.color)} aria-label="Remove item"><X size={17} /></button>
              </article>
            ))}

            <button className="premium-cart-continue" onClick={() => setPage("home")}>← Continue shopping</button>
          </section>

          <aside className="premium-cart-summary">
            <div className="premium-cart-summary-head">
              <div><small>ORDER</small><h2>Summary</h2></div>
              <span>{itemCount}</span>
            </div>

            <div className="premium-coupon-block">
              <label><Tag size={15} /><span>Promo code</span></label>
              {couponApplied ? (
                <div className="premium-coupon-success">
                  <div><b>{couponCode || coupon}</b><small>Discount {money(discount)}</small></div>
                  <button onClick={removeCoupon}><X size={15} /></button>
                </div>
              ) : (
                <div className="premium-coupon-input-row">
                  <input
                    value={coupon}
                    onChange={(event) => { setCoupon(event.target.value.toUpperCase()); setCouponError(""); }}
                    placeholder="ENTER PROMO CODE"
                  />
                  <button disabled={couponLoading} onClick={() => void handleCoupon()}>{couponLoading ? "Checking…" : "Apply"}</button>
                </div>
              )}
              {couponError && <p>{couponError}</p>}
            </div>

            <div className="premium-cart-totals">
              <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
              {couponApplied && <div className="discount"><span>Discount</span><b>-{money(discount)}</b></div>}
              <div><span>Shipping</span><b>{shipping === 0 ? "Free" : money(shipping)}</b></div>
              <div className="premium-cart-grand"><span>Total</span><b>{money(total)}</b></div>
            </div>

            <button
              className="premium-cart-checkout-button"
              onClick={() => {
                if (!isLoggedIn) {
                  if (typeof window !== "undefined") sessionStorage.setItem("shopvibe_after_login", "checkout");
                  setPage("login");
                } else {
                  setPage("checkout");
                }
              }}
            >
              <span>Proceed to checkout</span><ArrowRight size={17} />
            </button>

            <div className="premium-cart-secure">
              <ShieldCheck size={16} />
              <div><b>Protected checkout</b><span>Live totals are confirmed by your backend during checkout.</span></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
