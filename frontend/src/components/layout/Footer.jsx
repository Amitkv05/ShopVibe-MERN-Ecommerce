import { ShoppingBag } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Footer() {
  const { setPage, categories } = useStore();
  const groupA = categories.slice(0,4).map(c => c.label).join(" | ") || "Fashion | Accessories | Footwear | Electronics";
  return <footer className="footer">
    <div className="container brand-directory">
      <h3>Brand directory</h3>
      <p><b>Categories:</b>{groupA}</p>
      <p><b>ShopVibe:</b> Live catalog · secure checkout · wishlist · orders · customer account</p>
    </div>
    <div className="container footer-columns">
      <section><h3>Popular Categories</h3>{categories.slice(0,5).map(c => <button key={c.id} onClick={() => setPage("categories")}>{c.label}</button>)}</section>
      <section><h3>Shopping</h3><button onClick={() => setPage("categories")}>Browse Categories</button><button onClick={() => setPage("wishlist")}>Wishlist</button><button onClick={() => setPage("cart")}>Shopping Bag</button><button onClick={() => setPage("orders")}>My Orders</button></section>
      <section><h3>Our Company</h3><button onClick={() => setPage("home")}>Home</button><button onClick={() => setPage("categories")}>Categories</button><button onClick={() => setPage("orders")}>Orders</button></section>
      <section><h3>Services</h3><span>Secure payments</span><span>Easy returns</span><span>Customer support</span><span>Live catalog</span></section>
      <section><h3>Contact</h3><span>ShopVibe Support</span><span>support@shopvibe.local</span><span>Mon–Sat · 9AM–7PM</span></section>
    </div>
    <div className="footer-bottom"><div className="container"><ShoppingBag size={26} style={{margin:"0 auto 8px",color:"var(--accent)"}}/><p>© 2026 ShopVibe. Premium React storefront powered by your existing APIs.</p></div></div>
  </footer>;
}
