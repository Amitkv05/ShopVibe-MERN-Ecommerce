import { Heart, ShoppingBag, Eye } from "lucide-react";
import { useStore } from "@/lib/store";
import StarRating from "@/components/reusable/StarRating";
import Badge from "@/components/reusable/Badge";
import clsx from "clsx";
export default function ProductCard({ product, variant = "grid" }) {
    const { setPage, addToCart, toggleWishlist, wishlist } = useStore();
    const isWishlisted = wishlist.some((p) => p.id === product.id);
    const handleAddToCart = (e) => {
        e.stopPropagation();
        addToCart(product, product.sizes[0], product.colors[0]);
    };
    const handleWishlist = (e) => {
        e.stopPropagation();
        toggleWishlist(product);
    };
    if (variant === "list") {
        return (<div onClick={() => setPage("product", product.id)} className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 cursor-pointer group">
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-gray-50 shrink-0">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-violet-600 font-semibold uppercase tracking-wide">{product.brand}</p>
                <h3 className="font-semibold text-gray-900 mt-0.5 line-clamp-2">{product.name}</h3>
              </div>
              <button onClick={handleWishlist} className="shrink-0 p-1.5 rounded-xl hover:bg-rose-50 transition-colors">
                <Heart size={18} className={clsx(isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-400")}/>
              </button>
            </div>
            <StarRating rating={product.rating} showValue reviews={product.reviews} className="mt-2"/>
            <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{product.description}</p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">${product.price}</span>
              {product.originalPrice > product.price && (<span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>)}
              <Badge variant="danger" className="text-[10px]">-{product.discount}%</Badge>
            </div>
            <button onClick={handleAddToCart} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors">
              <ShoppingBag size={14}/>
              Add to Cart
            </button>
          </div>
        </div>
      </div>);
    }
    return (<div onClick={() => setPage("product", product.id)} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-150 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && <Badge variant="success" className="shadow-sm">New</Badge>}
          {product.isTrending && <Badge variant="warning" className="shadow-sm">🔥 Trending</Badge>}
          {product.discount > 0 && (<Badge variant="danger" className="shadow-sm">-{product.discount}%</Badge>)}
        </div>

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"/>
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-300">
          <button onClick={handleWishlist} className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all duration-200", isWishlisted
            ? "bg-rose-500 text-white"
            : "bg-white text-gray-600 hover:bg-rose-500 hover:text-white")}>
            <Heart size={16} fill={isWishlisted ? "currentColor" : "none"}/>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setPage("product", product.id); }} className="w-9 h-9 rounded-xl bg-white text-gray-600 hover:bg-violet-600 hover:text-white flex items-center justify-center shadow-md transition-all duration-200">
            <Eye size={16}/>
          </button>
        </div>

        {/* Add to Cart */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button onClick={handleAddToCart} className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-violet-700 text-white text-sm font-semibold transition-colors duration-200">
            <ShoppingBag size={16}/>
            Quick Add
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-violet-600 font-semibold uppercase tracking-wide">{product.brand}</p>
        <h3 className="font-semibold text-gray-900 mt-0.5 line-clamp-1">{product.name}</h3>
        <StarRating rating={product.rating} showValue reviews={product.reviews} className="mt-1.5"/>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-bold text-gray-900">${product.price}</span>
          {product.originalPrice > product.price && (<span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>)}
        </div>
      </div>
    </div>);
}
