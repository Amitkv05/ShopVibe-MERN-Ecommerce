import { useEffect, useMemo, useState } from "react";
import { MapPin, Plus, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { api, apiMessage } from "@/lib/api";
import OrderFlowButton from "@/components/reusable/OrderFlowButton";

function formatMoney(value, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutScreen() {
  const {
    cart,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    placeOrder,
    setPage,
    refreshAddresses,
    isLoggedIn,
    showToast,
    couponCode,
    user,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  useEffect(() => {
    if (isLoggedIn) void refreshAddresses();
  }, [isLoggedIn, refreshAddresses]);

  useEffect(() => {
    if (!selectedAddressId && addresses[0]?.id) setSelectedAddressId(addresses[0].id);
  }, [addresses, selectedAddressId, setSelectedAddressId]);

  const selectedAddr = addresses.find((address) => address.id === selectedAddressId) || addresses[0];
  const signature = useMemo(
    () => cart.map((item) => `${item.product.id}:${item.variantSku || ""}:${item.quantity}`).join("|"),
    [cart],
  );

  useEffect(() => {
    if (!isLoggedIn || !cart.length) {
      setQuote(null);
      return undefined;
    }

    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError("");

    api("/cart/quote", {
      method: "POST",
      body: { couponCode: couponCode || undefined },
    })
      .then((data) => {
        if (!cancelled) setQuote(data.quote || null);
      })
      .catch((error) => {
        if (!cancelled) setQuoteError(apiMessage(error, "Could not calculate server order total"));
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, signature, couponCode, cart.length]);

  const fallback = cart.reduce((amount, item) => amount + item.product.price * item.quantity, 0);
  const q = quote || {
    itemsPrice: fallback,
    discountPrice: 0,
    taxPrice: 0,
    shippingPrice: 0,
    totalPrice: fallback,
    currency: "INR",
  };

  const finishOrder = async (method, paymentInfo) => {
    const created = await placeOrder(method, couponCode, paymentInfo);
    setOrderComplete(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setOrderPlaced(true);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    return created;
  };

  const handleRazorpay = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) throw new Error("Razorpay Checkout could not be loaded");

    const orderItems = cart.map((item) => ({
      product: item.product.id,
      quantity: item.quantity,
      variantSku: item.variantSku || undefined,
    }));

    const payment = await api("/payment/order", {
      method: "POST",
      body: { orderItems, couponCode: couponCode || undefined },
    });
    const gateway = payment.paymentOrder;
    if (!gateway?.key || !gateway?.id) throw new Error("Razorpay Test Mode is not configured on the backend");

    await new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: gateway.key,
        amount: gateway.amount,
        currency: gateway.currency,
        order_id: gateway.id,
        name: "ShopVibe",
        description: "E-commerce order payment",
        prefill: {
          name: user?.name || selectedAddr?.name || "",
          email: user?.email || "",
          contact: selectedAddr?.phone || "",
        },
        theme: { color: "#f45f77" },
        handler: async (response) => {
          try {
            await finishOrder("RAZORPAY", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Payment window closed before completion")),
        },
      });
      checkout.open();
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddr) {
      showToast("Please select or add a delivery address", "error");
      return;
    }

    setLoading(true);
    setPlacing(true);
    try {
      if (paymentMethod === "RAZORPAY") await handleRazorpay();
      else await finishOrder("COD");
    } catch (error) {
      const message = apiMessage(error, "Checkout failed");
      if (!/Payment window closed/i.test(message)) showToast(message, "error");
    } finally {
      setLoading(false);
      setPlacing(false);
    }
  };

  if (!cart.length && !orderPlaced) {
    return (
      <div className="checkout-page">
        <header className="checkout-header">
          <button onClick={() => setPage("home")}>← Continue shopping</button>
          <strong>SHOPVIBE</strong>
          <span>Secure checkout</span>
        </header>
        <main className="checkout-empty-shell">
          <div className="empty-checkout">
            <ShieldCheck size={34} />
            <h3>Your cart is empty</h3>
            <p>Add a product before starting checkout.</p>
            <button onClick={() => setPage("home")}>Explore products</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="checkout-page checkout-page-v4">
      <header className="checkout-header">
        <button onClick={() => setPage("cart")}>← Back to cart</button>
        <strong>SHOPVIBE</strong>
        <span>Secure checkout · live API</span>
      </header>

      <main className="checkout-shell checkout-shell-v4">
        <section className="checkout-form-card checkout-form-card-v4">
          <div className="checkout-section-heading">
            <span>01</span>
            <div>
              <small>DELIVERY</small>
              <h1>Choose delivery address</h1>
              <p>Select one saved address. No extra continue step is required.</p>
            </div>
          </div>

          <div className="checkout-address-grid">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`checkout-address-card checkout-address-card-v4 ${selectedAddr?.id === address.id ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  checked={selectedAddr?.id === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                />
                <span className="checkout-radio-dot" />
                <div className="checkout-address-icon"><MapPin size={16} /></div>
                <div className="checkout-address-copy">
                  <div className="checkout-address-title-row">
                    <b>{address.name || "Saved address"}</b>
                    {address.isDefault && <small>Default</small>}
                  </div>
                  <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                  <p>{address.city}, {address.state} {address.zip}</p>
                  <span>{address.phone}</span>
                </div>
              </label>
            ))}

            <button type="button" className="checkout-add-address-card" onClick={() => setPage("addresses")}>
              <span><Plus size={18} /></span>
              <b>Add another address</b>
              <small>Manage saved delivery addresses</small>
            </button>
          </div>

          {!addresses.length && <div className="api-error checkout-inline-error">Add a delivery address before checkout.</div>}

          <div className="checkout-section-divider" />

          <div className="checkout-section-heading">
            <span>02</span>
            <div>
              <small>PAYMENT</small>
              <h2>Select payment method</h2>
              <p>Choose one method and place the order directly.</p>
            </div>
          </div>

          <div className="payment-options payment-options-v4">
            {[
              { id: "COD", label: "Cash on delivery", sub: "Pay when your order arrives", badge: "No online payment" },
              { id: "RAZORPAY", label: "Razorpay", sub: "Secure gateway payment with server verification", badge: "Online" },
            ].map((method) => (
              <label key={method.id}>
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                />
                <span className="payment-radio" />
                <span className="payment-copy">
                  <b>{method.label}</b>
                  <small>{method.sub}</small>
                </span>
                <em>{method.badge}</em>
              </label>
            ))}
          </div>

          {paymentMethod === "RAZORPAY" && (
            <p className="checkout-payment-note">Razorpay opens only when Test Mode keys are configured on your backend.</p>
          )}

          <div className="checkout-security-strip">
            <ShieldCheck size={17} />
            <div><b>Protected checkout</b><span>Pricing and order creation remain server-calculated pricing from your existing API.</span></div>
          </div>
        </section>

        <aside className="order-summary-card order-summary-card-v4">
          <div className="summary-title">
            <div><small>YOUR BAG</small><h2>Order summary</h2></div>
            <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>

          {quoteError && <div className="api-error" style={{ marginTop: 10 }}>{quoteError}</div>}
          {quoteLoading && <p className="api-quote-note">Refreshing server quote…</p>}

          <div className="summary-items summary-items-v4">
            {cart.map((item) => (
              <article key={`${item.product.id}-${item.variantSku || item.size}-${item.color}`}>
                <img src={item.product.image} alt={item.product.name} />
                <div>
                  <b>{item.product.name}</b>
                  <small>{item.size} · {item.color} · Qty {item.quantity}</small>
                </div>
                <strong>{formatMoney(item.product.price * item.quantity, q.currency)}</strong>
              </article>
            ))}
          </div>

          <div className="summary-lines">
            <p><span>Subtotal</span><b>{formatMoney(q.itemsPrice, q.currency)}</b></p>
            {q.discountPrice > 0 && <p><span>Discount</span><b>-{formatMoney(q.discountPrice, q.currency)}</b></p>}
            <p><span>Shipping</span><b>{q.shippingPrice === 0 ? "Free" : formatMoney(q.shippingPrice, q.currency)}</b></p>
            <p><span>Tax</span><b>{formatMoney(q.taxPrice, q.currency)}</b></p>
            <p className="summary-grand"><span>Total</span><b>{formatMoney(q.totalPrice, q.currency)}</b></p>
          </div>

          <OrderFlowButton
            loading={loading}
            placing={placing}
            done={orderComplete}
            disabled={!selectedAddr}
            onClick={handlePlaceOrder}
          >
            {paymentMethod === "RAZORPAY" ? "Pay & Place Order" : "Place Order"}
          </OrderFlowButton>

          {!selectedAddr && <p className="secure-note checkout-warning-note">Select a delivery address to continue.</p>}
          <p className="secure-note">🔒 Final totals and order creation still come from your backend.</p>
        </aside>
      </main>

      {orderPlaced && (
        <div className="order-success-toast">
          <span>✓</span>
          <div><b>Order confirmed</b><small>Your live order was created successfully.</small></div>
          <button onClick={() => setPage("orders")}>View orders</button>
        </div>
      )}
    </div>
  );
}
