import { useEffect, useMemo, useState } from "react";
import { CheckCircle, MapPin, CreditCard, ShoppingBag, ArrowLeft, Lock, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { api, apiMessage } from "@/lib/api";
import Button from "@/components/reusable/Button";
function formatMoney(value, currency = "INR") {
    try {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
    }
    catch {
        return `${currency} ${Number(value || 0).toFixed(2)}`;
    }
}
function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (typeof window === "undefined")
            return resolve(false);
        if (window.Razorpay)
            return resolve(true);
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
    const { cart, addresses, selectedAddressId, setSelectedAddressId, placeOrder, setPage, refreshAddresses, isLoggedIn, showToast, couponCode, user } = useStore();
    const [step, setStep] = useState("address");
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [quote, setQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState("");
    useEffect(() => { if (isLoggedIn)
        void refreshAddresses(); }, [isLoggedIn, refreshAddresses]);
    const selectedAddr = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
    const cartSignature = useMemo(() => cart.map((i) => `${i.product.id}:${i.variantSku || ""}:${i.quantity}`).join("|"), [cart]);
    useEffect(() => {
        if (!isLoggedIn || !cart.length) {
            setQuote(null);
            return;
        }
        let cancelled = false;
        setQuoteLoading(true);
        setQuoteError("");
        api("/cart/quote", { method: "POST", body: { couponCode: couponCode || undefined } })
            .then((d) => { if (!cancelled)
            setQuote(d.quote || null); })
            .catch((e) => { if (!cancelled)
            setQuoteError(apiMessage(e, "Could not calculate server order total")); })
            .finally(() => { if (!cancelled)
            setQuoteLoading(false); });
        return () => { cancelled = true; };
    }, [isLoggedIn, cartSignature, couponCode, cart.length]);
    const fallbackSubtotal = cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
    const displayQuote = quote || { itemsPrice: fallbackSubtotal, discountPrice: 0, taxPrice: 0, shippingPrice: 0, totalPrice: fallbackSubtotal, currency: "INR" };
    const finishOrder = async (method, paymentInfo) => {
        const created = await placeOrder(method, couponCode, paymentInfo);
        setOrderPlaced(true);
        return created;
    };
    const handleRazorpay = async () => {
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay)
            throw new Error("Razorpay Checkout could not be loaded");
        const orderItems = cart.map((item) => ({ product: item.product.id, quantity: item.quantity, variantSku: item.variantSku || undefined }));
        const payment = await api("/payment/order", { method: "POST", body: { orderItems, couponCode: couponCode || undefined } });
        const gateway = payment.paymentOrder;
        if (!gateway?.key || !gateway?.id)
            throw new Error("Razorpay Test Mode is not configured on the backend");
        await new Promise((resolve, reject) => {
            const checkout = new window.Razorpay({
                key: gateway.key,
                amount: gateway.amount,
                currency: gateway.currency,
                order_id: gateway.id,
                name: "ShopVibe",
                description: "E-commerce order payment",
                prefill: { name: user?.name || selectedAddr?.name || "", email: user?.email || "", contact: selectedAddr?.phone || "" },
                theme: { color: "#7c3aed" },
                handler: async (response) => {
                    try {
                        await finishOrder("RAZORPAY", {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        resolve();
                    }
                    catch (e) {
                        reject(e);
                    }
                },
                modal: { ondismiss: () => reject(new Error("Payment window closed before completion")) },
            });
            checkout.open();
        });
    };
    const handlePlaceOrder = async () => {
        if (!selectedAddr) {
            showToast("Please select or add a delivery address", "error");
            setStep("address");
            return;
        }
        setLoading(true);
        setPlacing(true);
        try {
            if (paymentMethod === "RAZORPAY")
                await handleRazorpay();
            else
                await finishOrder("COD");
        }
        catch (error) {
            const message = apiMessage(error, "Checkout failed");
            if (!/Payment window closed/i.test(message))
                showToast(message, "error");
        }
        finally {
            setLoading(false);
            setPlacing(false);
        }
    };
    const steps = [
        { id: "address", label: "Address", icon: <MapPin size={16}/> },
        { id: "payment", label: "Payment", icon: <CreditCard size={16}/> },
        { id: "review", label: "Review", icon: <ShoppingBag size={16}/> },
    ];
    const stepOrder = ["address", "payment", "review"];
    const currentStepIdx = stepOrder.indexOf(step);
    if (orderPlaced)
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10 max-w-md w-full text-center"><div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-emerald-500"/></div><h2 className="text-3xl font-bold text-gray-900 mb-2">Order Placed! 🎉</h2><p className="text-gray-500 mb-8">Your order has been saved by the backend. You&apos;ll receive a confirmation email when email delivery is configured.</p><div className="flex flex-col gap-3"><Button onClick={() => setPage("orders")} fullWidth size="lg">View My Orders</Button><Button onClick={() => setPage("home")} variant="outline" fullWidth size="lg">Continue Shopping</Button></div></div></div>;
    if (!cart.length)
        return <div className="min-h-[70vh] flex items-center justify-center"><div className="text-center"><p className="text-xl font-bold text-gray-900 mb-4">Your cart is empty</p><Button onClick={() => setPage("shop")}>Start Shopping</Button></div></div>;
    return <div className="min-h-screen bg-gray-50"><div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <div className="flex items-center gap-4 mb-8"><button onClick={() => setPage("cart")} className="p-2 rounded-xl hover:bg-white border border-gray-200 text-gray-500"><ArrowLeft size={20}/></button><div><h1 className="text-2xl font-bold text-gray-900">Checkout</h1><p className="text-gray-500 text-sm">{cart.reduce((a, i) => a + i.quantity, 0)} items · server-calculated pricing</p></div></div>
    <div className="flex items-center gap-0 mb-8">{steps.map((s, i) => <div key={s.id} className="flex items-center flex-1"><button onClick={() => stepOrder.indexOf(s.id) < currentStepIdx && setStep(s.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${step === s.id ? "bg-violet-600 text-white shadow-md shadow-violet-200" : stepOrder.indexOf(s.id) < currentStepIdx ? "text-emerald-600 bg-emerald-50" : "text-gray-400 bg-gray-100"}`}>{stepOrder.indexOf(s.id) < currentStepIdx ? <CheckCircle size={16}/> : s.icon}<span className="hidden sm:block">{s.label}</span></button>{i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${currentStepIdx > i ? "bg-emerald-400" : "bg-gray-200"}`}/>}</div>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2">
      {step === "address" && <div className="bg-white rounded-2xl border border-gray-100 p-6"><h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2"><MapPin size={20} className="text-violet-600"/>Delivery Address</h2><div className="space-y-3">{addresses.map(addr => <label key={addr.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer ${selectedAddressId === addr.id ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-gray-300"}`}><input type="radio" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-violet-600"/><div className="flex-1"><div className="flex items-center gap-2"><p className="font-semibold text-gray-900">{addr.name}</p>{addr.isDefault && <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-semibold">Default</span>}</div><p className="text-sm text-gray-600 mt-0.5">{addr.line1}{addr.line2 && `, ${addr.line2}`}</p><p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.zip}</p><p className="text-sm text-gray-600">{addr.country}</p><p className="text-sm text-gray-500 mt-1">{addr.phone}</p></div></label>)}{!addresses.length && <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">Add a delivery address before checkout.</div>}</div><button onClick={() => setPage("addresses")} className="mt-4 text-sm text-violet-600 font-medium hover:underline">+ Add New Address</button><div className="mt-6 flex justify-end"><Button size="lg" disabled={!selectedAddr} onClick={() => setStep("payment")} iconRight={<ArrowRight size={18}/>}>Continue to Payment</Button></div></div>}
      {step === "payment" && <div className="bg-white rounded-2xl border border-gray-100 p-6"><h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2"><CreditCard size={20} className="text-violet-600"/>Payment Method</h2><div className="space-y-3 mb-6">{[{ id: "COD", label: "Cash on Delivery", sub: "Backend creates the order immediately; pay on delivery" }, { id: "RAZORPAY", label: "Razorpay", sub: "Uses backend-created gateway order and server-side signature/amount verification" }].map(method => <label key={method.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer ${paymentMethod === method.id ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-gray-300"}`}><input type="radio" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="accent-violet-600"/><div><p className="font-semibold text-gray-900">{method.label}</p><p className="text-sm text-gray-500">{method.sub}</p></div></label>)}</div>{paymentMethod === "RAZORPAY" && <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">Razorpay code is wired. The popup will work only after Test Mode Key ID/Secret are configured on the backend. The secret is never sent to this frontend.</div>}<div className="flex justify-between mt-6"><Button variant="outline" onClick={() => setStep("address")} icon={<ArrowLeft size={16}/>}>Back</Button><Button size="lg" onClick={() => setStep("review")} iconRight={<ArrowRight size={18}/>}>Review Order</Button></div></div>}
      {step === "review" && <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6"><h2 className="text-lg font-bold text-gray-900">Review Your Order</h2><div className="p-4 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-2">Delivery To</p>{selectedAddr && <div className="text-sm text-gray-700"><p className="font-semibold">{selectedAddr.name}</p><p>{selectedAddr.line1}{selectedAddr.line2 ? `, ${selectedAddr.line2}` : ""}</p><p>{selectedAddr.city}, {selectedAddr.state} {selectedAddr.zip}</p></div>}</div><div className="space-y-3">{cart.map(item => <div key={`${item.product.id}-${item.variantSku || item.size}-${item.color}`} className="flex gap-3 py-3 border-b border-gray-50"><img src={item.product.image} alt="" className="w-14 h-14 rounded-xl object-cover bg-gray-50"/><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.product.name}</p><p className="text-xs text-gray-500">{item.size} • {item.color} • Qty: {item.quantity}</p></div><p className="font-semibold text-gray-900 shrink-0">{formatMoney(item.product.price * item.quantity, displayQuote.currency)}</p></div>)}</div><div className="flex justify-between mt-6"><Button variant="outline" onClick={() => setStep("payment")} icon={<ArrowLeft size={16}/>}>Back</Button><Button size="lg" loading={loading} onClick={handlePlaceOrder} icon={<Lock size={16}/>} className="bg-emerald-600 hover:bg-emerald-700">{placing ? "Processing…" : paymentMethod === "RAZORPAY" ? "Pay & Place Order" : "Place COD Order"} • {formatMoney(displayQuote.totalPrice, displayQuote.currency)}</Button></div></div>}
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 p-5 h-fit sticky top-24"><h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>{quoteError && <div className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{quoteError}</div>}{quoteLoading && <div className="mb-3 text-xs text-gray-500">Refreshing server quote…</div>}<div className="space-y-3 max-h-48 overflow-y-auto mb-4">{cart.map(item => <div key={`${item.product.id}-${item.variantSku || item.size}`} className="flex gap-2 text-sm"><img src={item.product.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-50 shrink-0"/><div className="flex-1 min-w-0"><p className="font-medium text-gray-900 line-clamp-1">{item.product.name}</p><p className="text-gray-500 text-xs">x{item.quantity}</p></div></div>)}</div><div className="border-t border-gray-100 pt-4 space-y-2"><div className="flex justify-between text-sm text-gray-600"><span>Items</span><span>{formatMoney(displayQuote.itemsPrice, displayQuote.currency)}</span></div>{displayQuote.discountPrice > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Discount {displayQuote.couponCode ? `(${displayQuote.couponCode})` : ""}</span><span>-{formatMoney(displayQuote.discountPrice, displayQuote.currency)}</span></div>}<div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span>{displayQuote.shippingPrice === 0 ? "FREE" : formatMoney(displayQuote.shippingPrice, displayQuote.currency)}</span></div><div className="flex justify-between text-sm text-gray-600"><span>Tax</span><span>{formatMoney(displayQuote.taxPrice, displayQuote.currency)}</span></div><div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100"><span>Total</span><span>{formatMoney(displayQuote.totalPrice, displayQuote.currency)}</span></div></div><p className="mt-3 text-[11px] text-gray-400">All final totals come from the backend quote/order calculation.</p></div>
    </div>
  </div></div>;
}
