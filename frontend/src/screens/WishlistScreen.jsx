import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/reusable/Button";
export default function WishlistScreen() {
    const { wishlist, toggleWishlist, addToCart, setPage } = useStore();
    if (wishlist.length === 0) {
        return (<div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
            <Heart size={40} className="text-rose-300"/>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-8">Save your favorite items here and shop them later!</p>
          <Button onClick={() => setPage("shop")} size="lg" iconRight={<ArrowRight size={18}/>}>
            Explore Products
          </Button>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart size={24} className="text-rose-500 fill-rose-500"/>
              My Wishlist
            </h1>
            <p className="text-gray-500 text-sm mt-1">{wishlist.length} saved items</p>
          </div>
          <button onClick={() => {
            wishlist.forEach((p) => toggleWishlist(p));
        }} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
            <Trash2 size={16}/>
            Clear All
          </button>
        </div>

        {/* Add All to Cart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Love everything?</p>
            <p className="text-sm text-gray-500">Add all wishlist items to your cart at once</p>
          </div>
          <Button onClick={() => {
            wishlist.forEach((p) => addToCart(p, p.sizes[0], p.colors[0]));
        }} icon={<ShoppingBag size={16}/>}>
            Add All to Cart
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {wishlist.map((product) => (<ProductCard key={product.id} product={product}/>))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => setPage("shop")} iconRight={<ArrowRight size={18}/>}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>);
}
