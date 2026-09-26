import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Headphones,
  RotateCcw,
  Shield,
  Truck,
  Zap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { BANNERS } from "@/lib/data";
import { api } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/reusable/Button";

function pageFromBannerPath(path = "/shop") {
  if (path === "/new-arrivals") return "newArrivals";
  if (path === "/categories") return "categories";
  if (path === "/") return "home";
  return "shop";
}

export default function HomeScreen() {
  const {
    setPage,
    setSelectedCategory,
    products,
    categories,
    fetchCatalog,
    catalogLoading,
    catalogError,
  } = useStore();

  const [remoteBanners, setRemoteBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!products.length) void fetchCatalog();
  }, [fetchCatalog, products.length]);

  useEffect(() => {
    let active = true;

    api("/banners")
      .then((data) => {
        if (active) setRemoteBanners(data.banners || []);
      })
      .catch(() => {
        if (active) setRemoteBanners([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const banners = remoteBanners.length ? remoteBanners : BANNERS;

  useEffect(() => {
    if (bannerIdx >= banners.length) setBannerIdx(0);
  }, [bannerIdx, banners.length]);

  useEffect(() => {
    if (!autoplay || banners.length <= 1) return undefined;

    const timer = window.setInterval(
      () => setBannerIdx((index) => (index + 1) % banners.length),
      4000
    );

    return () => window.clearInterval(timer);
  }, [autoplay, banners.length]);

  const categoryItems = useMemo(
    () => [{ id: "All", label: "All", icon: "🛍️", image: "" }, ...categories],
    [categories]
  );

  const trending = products.filter((product) => product.isTrending).slice(0, 4);
  const newArrivals = products.filter((product) => product.isNew).slice(0, 4);
  const featured = products.slice(0, 8);
  const banner = banners[bannerIdx] || BANNERS[0];
  const imageUrl = banner?.image?.url || "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div
          className={`relative min-h-[320px] overflow-hidden rounded-3xl bg-gradient-to-r ${
            banner.bg || "from-violet-700 via-purple-700 to-indigo-800"
          } sm:min-h-[400px]`}
          style={
            imageUrl
              ? {
                  backgroundImage: `url(${imageUrl})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }
              : undefined
          }
          onMouseEnter={() => setAutoplay(false)}
          onMouseLeave={() => setAutoplay(true)}
        >
          {imageUrl ? (
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: Number(banner.overlayOpacity ?? 0.3) }}
            />
          ) : (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-white/10" />
              <div className="absolute left-1/3 top-1/4 h-40 w-40 rounded-full bg-white/5" />
            </div>
          )}

          <div
            className="absolute w-[min(82%,680px)] -translate-x-1/2 -translate-y-1/2 text-white"
            style={{
              left: `${Number(banner.textX ?? 30)}%`,
              top: `${Number(banner.textY ?? 50)}%`,
              textAlign: banner.textAlign || "left",
            }}
          >
            {banner.badge && (
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                <Zap size={14} /> {banner.badge}
              </span>
            )}

            <h1 className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
              {banner.title}
            </h1>
            <p className="mb-8 text-lg text-white/85">{banner.subtitle}</p>

            <Button
              size="lg"
              variant="secondary"
              onClick={() => setPage(pageFromBannerPath(banner.ctaPath))}
              iconRight={<ArrowRight size={18} />}
              className="!bg-white !text-gray-900 !shadow-xl hover:!bg-gray-100"
            >
              {banner.ctaText || banner.cta || "Shop Now"}
            </Button>
          </div>

          {banners.length > 1 && (
            <>
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                {banners.map((item, index) => (
                  <button
                    type="button"
                    key={item._id || `${item.title}-${index}`}
                    onClick={() => setBannerIdx(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === bannerIdx ? "w-8 bg-white" : "w-2 bg-white/50"
                    }`}
                    aria-label={`Show banner ${index + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setBannerIdx(
                    (index) => (index - 1 + banners.length) % banners.length
                  )
                }
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                aria-label="Previous banner"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setBannerIdx((index) => (index + 1) % banners.length)
                }
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                aria-label="Next banner"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: <Truck size={24} />, title: "Free Shipping", desc: "On eligible orders" },
            { icon: <Shield size={24} />, title: "Secure Payment", desc: "Protected checkout" },
            { icon: <RotateCcw size={24} />, title: "Easy Returns", desc: "Simple return flow" },
            { icon: <Headphones size={24} />, title: "Support", desc: "We are here to help" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Shop by Category
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Find exactly what you&apos;re looking for
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage("categories")}>
            View All
          </Button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categoryItems.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.label);
                setPage("categories");
              }}
              className="group flex min-w-[100px] flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-none"
            >
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.label}
                  className="h-14 w-14 rounded-xl object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <CategoryIcon category={category} />
              )}
              <span className="whitespace-nowrap text-xs font-semibold text-gray-700 dark:text-gray-200">
                {category.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {catalogError && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {catalogError}
          </div>
        </section>
      )}

      <ProductSection
        title="🔥 Trending Now"
        subtitle="Most popular picks"
        products={trending}
        loading={catalogLoading}
        actionLabel="See All"
        onAction={() => setPage("shop")}
      />

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPage("newArrivals")}
            className="group relative flex min-h-[180px] items-end overflow-hidden rounded-3xl bg-gradient-to-r from-rose-400 to-pink-600 p-8 text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-pink-600 transition-transform duration-500 group-hover:scale-105" />
            <div className="relative">
              <Badge className="mb-3">New Arrivals</Badge>
              <h3 className="text-2xl font-bold text-white">Fresh Collection</h3>
              <p className="mt-1 text-pink-100">Explore newly added products</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPage("categories")}
            className="group relative flex min-h-[180px] items-end overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 transition-transform duration-500 group-hover:scale-105" />
            <div className="relative">
              <Badge className="mb-3">Categories</Badge>
              <h3 className="text-2xl font-bold text-white">Find Your Style</h3>
              <p className="mt-1 text-blue-100">Browse the catalog by category</p>
            </div>
          </button>
        </div>
      </section>

      <ProductSection
        title="✨ New Arrivals"
        subtitle="Fresh styles just added"
        products={newArrivals}
        loading={catalogLoading}
        actionLabel="See All"
        onAction={() => setPage("newArrivals")}
      />

      <ProductSection
        title="Featured Products"
        subtitle="Handpicked from the current catalog"
        products={featured}
        loading={catalogLoading}
        actionLabel="Shop All"
        onAction={() => setPage("shop")}
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-purple-700 p-8 text-center sm:p-12">
          <h2 className="mb-3 text-3xl font-bold text-white">Get Exclusive Deals</h2>
          <p className="mx-auto mb-8 max-w-md text-violet-200">
            Subscribe to be the first to know about new arrivals and promotions.
          </p>
          <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email..."
              className="flex-1 rounded-xl border border-white/30 bg-white/20 px-5 py-3.5 text-sm text-white outline-none placeholder:text-white/60 focus:border-white"
            />
            <Button
              variant="secondary"
              className="shrink-0 !bg-white !text-violet-700 hover:!bg-gray-100"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductSection({ title, subtitle, products, loading, actionLabel, onAction }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          iconRight={<ArrowRight size={14} />}
        >
          {actionLabel}
        </Button>
      </div>

      {loading && !products.length ? (
        <div className="py-10 text-center text-sm text-gray-500">Loading products…</div>
      ) : products.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          No matching products yet.
        </div>
      )}
    </section>
  );
}

function CategoryIcon({ category }) {
  if (typeof category.icon === "string" && /^https?:\/\//i.test(category.icon)) {
    return (
      <img
        src={category.icon}
        alt=""
        className="h-12 w-12 rounded-xl object-cover transition-transform duration-200 group-hover:scale-110"
      />
    );
  }

  return (
    <span className="text-3xl transition-transform duration-200 group-hover:scale-110">
      {category.icon || "🛍️"}
    </span>
  );
}

function Badge({ children, className }) {
  return (
    <span
      className={`inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm ${
        className ?? ""
      }`}
    >
      {children}
    </span>
  );
}
