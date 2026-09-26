import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Tag, X, ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import Button from "@/components/reusable/Button";
import { useState } from "react";
export default function CartScreen() {
    const { cart, removeFromCart, updateQty, clearCart, setPage, isLoggedIn, couponCode, setCouponCode, showToast } = useStore();
    const [coupon, setCoupon] = useState("");
    const [couponApplied, setCouponApplied] = useState(Boolean(couponCode));
    const [discountAmount, setDiscountAmount] = useState(0);
    const [serverTotal, setServerTotal] = useState(null);
    const [couponError, setCouponError] = useState("");
    const subtotal = cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
    const shipping = subtotal > 50 ? 0 : 9.99;
    const discount = couponApplied ? discountAmount : 0;
    const tax = 0;
    const total = serverTotal ?? (subtotal - discount + shipping);
    const handleCoupon = async () => {
        if (!isLoggedIn) {
            setCouponError("Sign in to validate and use a coupon.");
            return;
        }
        try {
            const orderItems = cart.map((i) => ({ product: i.product.id, quantity: i.quantity, variantSku: i.variantSku || "" }));
            const data = await api("/coupon/validate", { method: "POST", body: { couponCode: coupon.trim().toUpperCase(), orderItems } });
            setCouponApplied(true);
            setCouponError("");
            setDiscountAmount(Number(data.discountPrice || 0));
            setServerTotal(Number(data.totalPrice || 0));
            setCouponCode(data.couponCode || coupon.trim().toUpperCase());
            showToast("Coupon applied", "success");
        }
        catch (error) {
            setCouponApplied(false);
            setDiscountAmount(0);
            setServerTotal(null);
            setCouponCode("");
            setCouponError(error instanceof Error ? error.message : "Invalid coupon");
        }
    };
    if (cart.length === 0) {
        return (<div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-6">
            <ShoppingCart size={40} className="text-violet-300"/>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven&apos;t added any items yet. Start shopping!</p>
          <Button onClick={() => setPage("shop")} size="lg" iconRight={<ArrowRight size={18}/>}>
            Start Shopping
          </Button>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-500 text-sm mt-1">{cart.reduce((a, i) => a + i.quantity, 0)} items</p>
          </div>
          <button onClick={clearCart} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
            <Trash2 size={16}/>
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (<div key={`${item.product.id}-${item.size}-${item.color}`} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex gap-4">
                <div onClick={() => setPage("product", item.product.id)} className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-50 cursor-pointer shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover hover:scale-105 transition-transform"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-violet-600 font-semibold">{item.product.brand}</p>
                      <button onClick={() => setPage("product", item.product.id)} className="text-sm sm:text-base font-semibold text-gray-900 hover:text-violet-600 line-clamp-2 text-left transition-colors">
                        {item.product.name}
                      </button>
                      <div className="flex gap-3 mt-1.5">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">Size: {item.size}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">{item.color}</span>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id, item.size, item.color)} className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                      <X size={18}/>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Qty */}
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button onClick={() => {
                if (item.quantity === 1)
                    removeFromCart(item.product.id, item.size, item.color);
                else
                    updateQty(item.product.id, item.size, item.color, item.quantity - 1);
            }} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                        <Minus size={14}/>
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, item.size, item.color, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                        <Plus size={14}/>
                      </button>
                    </div>
                    {/* Price */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                      {item.quantity > 1 && (<p className="text-xs text-gray-400">₹{item.product.price} each</p>)}
                    </div>
                  </div>
                </div>
              </div>))}

            {/* Continue Shopping */}
            <button onClick={() => setPage("shop")} className="flex items-center gap-2 text-sm text-violet-600 font-medium hover:text-violet-800 transition-colors mt-2">
              <ShoppingBag size={16}/>
              Continue Shopping
            </button>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag size={16} className="text-violet-600"/>
                Promo Code
              </h3>
              {couponApplied ? (<div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">{couponCode || coupon} applied!</p>
                    <p className="text-xs text-emerald-600">Discount (-₹{discount.toFixed(2)})</p>
                  </div>
                  <button onClick={() => { setCouponApplied(false); setCoupon(""); setCouponCode(""); setDiscountAmount(0); setServerTotal(null); }} className="text-emerald-600 hover:text-emerald-800">
                    <X size={16}/>
                  </button>
                </div>) : (<>
                  <div className="flex gap-2">
                    <input value={coupon} onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(""); }} placeholder="Enter promo code" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-violet-400 uppercase"/>
                    <button onClick={handleCoupon} className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors">
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
                </>)}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-base font-bold text-gray-900 mb-5">Order Summary</h3>
              <div className="space-y-3">
                {[
            { label: "Subtotal", value: `₹${subtotal.toFixed(2)}` },
            couponApplied ? { label: "Discount", value: `-₹${discount.toFixed(2)}`, className: "text-emerald-600" } : null,
            { label: `Shipping ${subtotal > 50 ? "(Free)" : ""}`, value: shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`, className: shipping === 0 ? "text-emerald-600" : undefined },
        ].filter(Boolean).map((item) => item && (<div key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    <span className={`font-medium text-gray-900 ${item.className ?? ""}`}>{item.value}</span>
                  </div>))}
                <div className="pt-3 border-t border-gray-100 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-gray-900">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <Button fullWidth size="lg" className="mt-5" iconRight={<ArrowRight size={18}/>} onClick={() => {
            if (!isLoggedIn) {
                if (typeof window !== "undefined")
                    sessionStorage.setItem("shopvibe_after_login", "checkout");
                setPage("login");
            }
            else
                setPage("checkout");
        }}>
                Proceed to Checkout
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span>🔒</span>
                <span>Secure SSL Encrypted Checkout</span>
              </div>

              {subtotal < 50 && (<div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 text-center font-medium">
                    Add ₹{(50 - subtotal).toFixed(2)} more for free shipping! 🚚
                  </p>
                </div>)}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 text-center mb-3">We accept</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {["VISA", "MC", "PayPal", "Apple Pay", "Google Pay"].map((p) => (<span key={p} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600">
                    {p}
                  </span>))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
