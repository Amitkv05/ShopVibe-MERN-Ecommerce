const icons = ["🛍️", "👔", "👗", "🧒", "👟", "👜", "⚽", "💻"];
function mapAttributes(value) {
    if (!value)
        return {};
    if (value instanceof Map)
        return Object.fromEntries(value);
    if (typeof value === "object")
        return value;
    return {};
}
export function adaptProduct(raw) {
    const variants = (raw?.variants || []).filter((v) => v?.active !== false).map((v) => ({
        sku: String(v.sku || ""), attributes: mapAttributes(v.attributes), price: v.price == null ? undefined : Number(v.price),
        stock: Number(v.stock || 0), active: v.active !== false, image: v.image || "",
    }));
    const attributes = variants.flatMap((v) => Object.entries(v.attributes));
    const sizeKeys = ["size", "Size", "SIZE"];
    const colorKeys = ["color", "Color", "colour", "Colour", "COLOR"];
    const sizes = [...new Set(attributes.filter(([k]) => sizeKeys.includes(k)).map(([, v]) => String(v)))];
    const colors = [...new Set(attributes.filter(([k]) => colorKeys.includes(k)).map(([, v]) => String(v)))];
    const images = (raw?.images || []).map((x) => typeof x === "string" ? x : x?.url).filter(Boolean);
    const created = raw?.createdAt ? new Date(raw.createdAt).getTime() : 0;
    const activeVariantStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
    const stock = variants.length ? activeVariantStock : Number(raw?.stock ?? raw?.Stock ?? 0);
    return {
        id: String(raw?._id || raw?.id || ""), name: raw?.name || "Unnamed product", brand: raw?.brand || "",
        price: Number(raw?.price || 0), originalPrice: Number(raw?.originalPrice || raw?.price || 0), discount: Number(raw?.discount || 0),
        rating: Number(raw?.ratings || raw?.rating || 0), reviews: Number(raw?.numOfReviews || raw?.reviews?.length || 0),
        image: images[0] || "https://placehold.co/600x800?text=Product", images: images.length ? images : ["https://placehold.co/600x800?text=Product"],
        category: raw?.category || "General", description: raw?.description || "", sizes: sizes.length ? sizes : ["Standard"],
        colors: colors.length ? colors : ["Default"], inStock: stock > 0, isNew: created > Date.now() - 30 * 86400000,
        isTrending: Number(raw?.ratings || 0) >= 4.5, tags: [raw?.category, raw?.brand].filter(Boolean), stock, variants, raw,
    };
}
export function adaptCategory(raw, index = 0) {
    return {
        id: String(raw?._id || raw?.id || raw?.name || index),
        label: raw?.name || "Category",
        slug: raw?.slug,
        icon: raw?.icon?.url || icons[index % icons.length],
        image: raw?.image?.url || "",
        raw,
    };
}
export function getVariantSku(product, size = "", color = "") {
    if (!product.variants.length)
        return "";
    const normalized = (s) => s.trim().toLowerCase();
    const found = product.variants.find((variant) => {
        const values = Object.values(variant.attributes).map((v) => normalized(String(v)));
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
