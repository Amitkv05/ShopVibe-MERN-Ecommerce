const icons = ["🛍️", "👔", "👗", "🧒", "👟", "👜", "⚽", "💻"];

function mapAttributes(value) {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value === "object") return value;
  return {};
}

export function adaptProduct(raw) {
  const variants = (raw?.variants || [])
    .filter((variant) => variant?.active !== false)
    .map((variant) => ({
      sku: String(variant.sku || ""),
      attributes: mapAttributes(variant.attributes),
      price: variant.price == null ? undefined : Number(variant.price),
      stock: Number(variant.stock || 0),
      active: variant.active !== false,
      image: variant.image || "",
    }));

  const attributes = variants.flatMap((variant) => Object.entries(variant.attributes));
  const sizeKeys = ["size", "Size", "SIZE"];
  const colorKeys = ["color", "Color", "colour", "Colour", "COLOR"];
  const sizes = [...new Set(attributes.filter(([key]) => sizeKeys.includes(key)).map(([, value]) => String(value)))];
  const colors = [...new Set(attributes.filter(([key]) => colorKeys.includes(key)).map(([, value]) => String(value)))];
  const images = (raw?.images || []).map((image) => (typeof image === "string" ? image : image?.url)).filter(Boolean);
  const created = raw?.createdAt ? new Date(raw.createdAt).getTime() : 0;
  const activeVariantStock = variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  const stock = variants.length ? activeVariantStock : Number(raw?.stock ?? raw?.Stock ?? 0);

  return {
    id: String(raw?._id || raw?.id || ""),
    name: raw?.name || "Unnamed product",
    brand: raw?.brand || "",
    price: Number(raw?.price || 0),
    originalPrice: Number(raw?.originalPrice || raw?.price || 0),
    discount: Number(raw?.discount || 0),
    rating: Number(raw?.ratings || raw?.rating || 0),
    reviews: Number(raw?.numOfReviews || raw?.reviews?.length || 0),
    image: images[0] || "https://placehold.co/600x800?text=Product",
    images: images.length ? images : ["https://placehold.co/600x800?text=Product"],
    category: raw?.category || "General",
    categoryRef: String(raw?.categoryRef?._id || raw?.categoryRef || ""),
    subcategory: raw?.subcategory || "",
    subcategoryRef: String(raw?.subcategoryRef?._id || raw?.subcategoryRef || ""),
    description: raw?.description || "",
    sizes: sizes.length ? sizes : ["Standard"],
    colors: colors.length ? colors : ["Default"],
    inStock: stock > 0,
    isNew: created > Date.now() - 30 * 86400000,
    isTrending: Boolean(raw?.popular) || Number(raw?.ratings || 0) >= 4.5,
    isRecommended: Boolean(raw?.recommended),
    tags: [raw?.category, raw?.subcategory, raw?.brand].filter(Boolean),
    stock,
    variants,
    raw,
  };
}

export function adaptSubcategory(raw) {
  return {
    id: String(raw?._id || raw?.id || raw?.name || ""),
    label: raw?.name || "Subcategory",
    slug: raw?.slug || "",
    description: raw?.description || "",
    categoryRef: String(raw?.categoryRef?._id || raw?.categoryRef || ""),
    categoryName: raw?.categoryName || raw?.categoryRef?.name || "",
    image: raw?.image?.url || "",
    active: raw?.active !== false,
    sortOrder: Number(raw?.sortOrder || 0),
    raw,
  };
}

export function adaptCategory(raw, index = 0) {
  const subcategories = (raw?.subcategories || []).map(adaptSubcategory);
  return {
    id: String(raw?._id || raw?.id || raw?.name || index),
    label: raw?.name || "Category",
    slug: raw?.slug || "",
    description: raw?.description || "",
    icon: raw?.icon?.url || icons[index % icons.length],
    image: raw?.image?.url || "",
    banner: raw?.banner?.url || "",
    active: raw?.active !== false,
    sortOrder: Number(raw?.sortOrder || 0),
    subcategories,
    raw,
  };
}

export function getVariantSku(product, size = "", color = "") {
  if (!product.variants.length) return "";
  const normalized = (value) => value.trim().toLowerCase();
  const found = product.variants.find((variant) => {
    const values = Object.values(variant.attributes).map((value) => normalized(String(value)));
    const sizeOk = !size || size === "Standard" || values.includes(normalized(size));
    const colorOk = !color || color === "Default" || values.includes(normalized(color));
    return sizeOk && colorOk;
  });
  return found?.sku || product.variants[0]?.sku || "";
}

export const BANNERS = [
  { title: "New Season. New Energy.", subtitle: "Fresh arrivals, now from your live catalog.", ctaText: "Shop Now", ctaPath: "/shop", badge: "Live Catalog", bg: "from-violet-700 via-purple-700 to-indigo-800", overlayOpacity: 0, textX: 28, textY: 50, textAlign: "left", image: { url: "" } },
  { title: "Everyday Essentials", subtitle: "Browse products without signing in.", ctaText: "Explore", ctaPath: "/categories", badge: "Guest Shopping", bg: "from-slate-900 via-violet-900 to-purple-800", overlayOpacity: 0, textX: 28, textY: 50, textAlign: "left", image: { url: "" } },
];
