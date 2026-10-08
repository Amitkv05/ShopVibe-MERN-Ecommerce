import { Heart, Trash2, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/reusable/Button";

export default function WishlistScreen() {
  const { wishlist, toggleWishlist, addToCart, setPage } = useStore();

  if (!wishlist.length) return <div className="premium-wishlist-empty-page">
    <div className="premium-wishlist-empty-card">
      <div className="premium-wishlist-art"><span/><Heart size={44}/><i/></div>
      <span className="premium-eyebrow">YOUR COLLECTION</span>
      <h1>Your wishlist is waiting</h1>
      <p>Save products you love and come back whenever you&apos;re ready.</p>
      <Button onClick={() => setPage("shop")} size="lg" iconRight={<ArrowRight size={18}/>}>Explore Products</Button>
      <small><Sparkles size={13}/> Saved products stay synced with your account.</small>
    </div>
  </div>;

  const addAll = async () => {
    for (const product of wishlist) await addToCart(product, product.sizes?.[0] || "Standard", product.colors?.[0] || "Default");
    window.dispatchEvent(new Event("shopvibe:cart-added"));
  };

  return <div className="premium-wishlist-page">
    <div className="premium-page-shell">
      <header className="premium-page-heading"><div><span>WISHLIST</span><h1>Saved for later</h1><p>{wishlist.length} products you&apos;ve marked as favorites.</p></div><button className="premium-text-danger" onClick={() => wishlist.forEach((product) => void toggleWishlist(product))}><Trash2 size={16}/> Clear all</button></header>
      <section className="premium-wishlist-banner"><div><ShoppingBag size={20}/><div><b>Ready to checkout your favorites?</b><span>Add every saved product to your cart in one go.</span></div></div><Button onClick={addAll} icon={<ShoppingBag size={16}/>}>Add all to cart</Button></section>
      <div className="catalog-products-grid">{wishlist.map((product) => <ProductCard key={product.id} product={product}/>)}</div>
      <div className="premium-center-action"><Button variant="outline" onClick={() => setPage("shop")} iconRight={<ArrowRight size={18}/>}>Continue Shopping</Button></div>
    </div>
  </div>;
}
