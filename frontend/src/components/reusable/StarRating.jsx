import { Star } from "lucide-react";
import clsx from "clsx";
export default function StarRating({ rating, max = 5, size = 14, showValue = false, reviews, className, }) {
    return (<div className={clsx("flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
            const fill = Math.min(1, Math.max(0, rating - i));
            return (<span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="text-gray-200 absolute top-0 left-0" fill="currentColor"/>
            <span className="absolute top-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-amber-400" fill="currentColor"/>
            </span>
          </span>);
        })}
      {showValue && (<span className="text-xs font-semibold text-gray-700 ml-0.5">{rating.toFixed(1)}</span>)}
      {reviews !== undefined && (<span className="text-xs text-gray-400">({reviews.toLocaleString()})</span>)}
    </div>);
}
