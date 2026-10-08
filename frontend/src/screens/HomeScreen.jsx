import { useEffect, useMemo, useRef, useState } from "react";

import {
  Headphones,
  RotateCcw,
  Rocket,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { useStore } from "@/lib/store";

import { BANNERS } from "@/lib/data";

import { api } from "@/lib/api";

import ProductCard, {
  flyProductToCart,
  Rating,
} from "@/components/product/ProductCard";

const HERO_WAIT_MS = 4500;

const CATEGORY_WAIT_MS = 2800;

const BEST_SELLER_WAIT_MS = CATEGORY_WAIT_MS;
const BEST_SELLER_VISIBLE_COUNT = 4;

let homeCatalogCache = [];

let homeCatalogPromise = null;

let homeCatalogFetchedAt = 0;

const HOME_CATALOG_TTL_MS = 15000;

function money(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

function categoryIcon(category) {
  const icon = category?.icon || "🛍️";

  if (/^(https?:|data:|\/)/.test(icon)) return <img src={icon} alt="" />;

  return <span style={{ fontSize: 28, lineHeight: 1 }}>{icon}</span>;
}

function bannerImage(banner) {
  return banner?.image?.url || banner?.image || "";
}

export default function HomeScreen() {
  const {
    products,

    categories,

    fetchCatalog,

    catalogLoading,

    catalogError,

    setPage,

    setSelectedCategory,

    addToCart,
  } = useStore();

  const [remoteBanners, setRemoteBanners] = useState([]);

  const [homeProducts, setHomeProducts] = useState(() =>
    homeCatalogCache.length ? homeCatalogCache : products,
  );

  const [heroIndex, setHeroIndex] = useState(0);

  const [heroPaused, setHeroPaused] = useState(false);

  const [categoryPaused, setCategoryPaused] = useState(false);

  const [bestSellerIndex, setBestSellerIndex] = useState(0);

  const [bestSellerPaused, setBestSellerPaused] = useState(false);

  const [dealAdded, setDealAdded] = useState(false);

  const [dealAdding, setDealAdding] = useState(false);

  const [remaining, setRemaining] = useState(
    5 * 86400 + 8 * 3600 + 27 * 60 + 16,
  );

  const categoryRef = useRef(null);

  const dealImageRef = useRef(null);

  useEffect(() => {
    let alive = true;

    if (homeCatalogCache.length) setHomeProducts(homeCatalogCache);

    const refreshHomeCatalog = async () => {
      if (!homeCatalogPromise) {
        homeCatalogPromise = fetchCatalog()
          .then(() => {
            const fullCatalog = useStore.getState().products;

            if (fullCatalog.length) {
              homeCatalogCache = fullCatalog;

              homeCatalogFetchedAt = Date.now();
            }
          })

          .finally(() => {
            homeCatalogPromise = null;
          });
      }

      await homeCatalogPromise;

      if (alive && homeCatalogCache.length) setHomeProducts(homeCatalogCache);
    };

    if (
      !homeCatalogCache.length ||
      Date.now() - homeCatalogFetchedAt > HOME_CATALOG_TTL_MS
    ) {
      void refreshHomeCatalog().catch(() => undefined);
    }

    return () => {
      alive = false;
    };
  }, [fetchCatalog]);

  useEffect(() => {
    let alive = true;

    api("/banners")
      .then((d) => {
        if (alive) setRemoteBanners(d.banners || []);
      })

      .catch(() => {
        if (alive) setRemoteBanners([]);
      });

    return () => {
      alive = false;
    };
  }, []);

  const banners = remoteBanners.length ? remoteBanners : BANNERS;

  useEffect(() => {
    if (heroPaused || banners.length < 2) return undefined;

    const id = window.setInterval(
      () => setHeroIndex((v) => (v + 1) % banners.length),

      HERO_WAIT_MS,
    );

    return () => window.clearInterval(id);
  }, [heroPaused, banners.length]);

  useEffect(() => {
    if (heroIndex >= banners.length) setHeroIndex(0);
  }, [heroIndex, banners.length]);

  // Category side bar

  useEffect(() => {
    const el = categoryRef.current;

    if (!el || categoryPaused || categories.length < 2) return undefined;

    const id = window.setInterval(() => {
      const card = el.querySelector(".category-card");

      if (!card) return;

      const step = card.getBoundingClientRect().width + 16;

      const atEnd =
        Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth - 4;

      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + step,

        behavior: "smooth",
      });
    }, CATEGORY_WAIT_MS);

    return () => window.clearInterval(id);
  }, [categoryPaused, categories.length]);

  useEffect(() => {
    const id = window.setInterval(
      () => setRemaining((v) => Math.max(0, v - 1)),

      1000,
    );

    return () => window.clearInterval(id);
  }, []);

  const catalogProducts = homeProducts.length ? homeProducts : products;

  const bestSellers = useMemo(
    () =>
      [...catalogProducts]

        .sort((a, b) => (b.rating || 0) - (a.rating || 0))

        .slice(0, 8),

    [catalogProducts],
  );

  // Best Seller sidebar: show 4 items and rotate one item at a time.
  useEffect(() => {
    if (bestSellerPaused || bestSellers.length <= BEST_SELLER_VISIBLE_COUNT) {
      return undefined;
    }

    const id = window.setInterval(() => {
      setBestSellerIndex((current) => (current + 1) % bestSellers.length);
    }, BEST_SELLER_WAIT_MS);

    return () => window.clearInterval(id);
  }, [bestSellerPaused, bestSellers.length]);

  useEffect(() => {
    if (!bestSellers.length) {
      if (bestSellerIndex !== 0) setBestSellerIndex(0);
      return;
    }

    if (bestSellerIndex >= bestSellers.length) {
      setBestSellerIndex(0);
    }
  }, [bestSellerIndex, bestSellers.length]);

  const visibleBestSellers = useMemo(() => {
    if (!bestSellers.length) return [];

    const count = Math.min(BEST_SELLER_VISIBLE_COUNT, bestSellers.length);

    return Array.from({ length: count }, (_, offset) => {
      const index = (bestSellerIndex + offset) % bestSellers.length;
      return bestSellers[index];
    });
  }, [bestSellers, bestSellerIndex]);

  const newArrivals = useMemo(
    () =>
      catalogProducts

        .filter((p) => p.isNew)

        .slice(0, 4)

        .concat(catalogProducts.slice(0, 4))

        .slice(0, 4),

    [catalogProducts],
  );

  const trending = useMemo(
    () =>
      catalogProducts

        .filter((p) => p.isTrending)

        .slice(0, 4)

        .concat(catalogProducts.slice(4, 8))

        .slice(0, 4),

    [catalogProducts],
  );

  const topRated = useMemo(
    () =>
      [...catalogProducts]

        .sort((a, b) => (b.rating || 0) - (a.rating || 0))

        .slice(0, 4),

    [catalogProducts],
  );

  const deal = trending[0] || catalogProducts[0];

  const featured = catalogProducts.slice(0, 12);

  const hero = banners[heroIndex] || banners[0] || {};

  const days = Math.floor(remaining / 86400),
    hours = Math.floor((remaining % 86400) / 3600),
    mins = Math.floor((remaining % 3600) / 60),
    secs = remaining % 60;

  const openCategory = (category) => {
    setSelectedCategory(category.label);

    setPage("categories");
  };

  const addDeal = async () => {
    if (!deal || dealAdding) return;

    setDealAdding(true);

    setDealAdded(false);

    try {
      await addToCart(
        deal,

        deal.sizes?.[0] || "Standard",

        deal.colors?.[0] || "Default",
      );

      flyProductToCart(dealImageRef.current);

      setDealAdded(true);

      window.dispatchEvent(
        new window.CustomEvent("shopvibe:cart-added", {
          detail: { productId: deal.id },
        }),
      );

      window.setTimeout(() => setDealAdded(false), 1650);
    } finally {
      setDealAdding(false);
    }
  };

  return (
    <div className="app storefront-page">
      <section
        className="hero container"
        id="top"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div
          className="hero-track"
          style={{ transform: `translateX(-${heroIndex * 100}%)` }}
        >
          {banners.map((b, index) => (
            <article
              className="hero-slide"
              key={b._id || `${b.title}-${index}`}
            >
              {bannerImage(b) ? (
                <img src={bannerImage(b)} alt={b.title || "ShopVibe banner"} />
              ) : (
                <div className="hero-fallback" />
              )}

              {(b.badge || b.title || b.subtitle || b.ctaText || b.cta) && (
                <div className="hero-copy">
                  {b.badge && <p>{b.badge}</p>}

                  {b.title && <h1>{b.title}</h1>}

                  {b.subtitle && (
                    <div className="hero-price">
                      <span>{b.subtitle}</span>
                    </div>
                  )}

                  {(b.ctaText || b.cta) && (
                    <button
                      onClick={() => {
                        const path = b.ctaPath || "/";

                        if (path === "/categories") setPage("categories");
                        else if (path === "/wishlist") setPage("wishlist");
                        else if (path === "/cart") setPage("cart");
                        else if (path === "/new-arrivals")
                          setPage("newArrivals");
                        else if (path === "/shop") setPage("shop");
                        else setPage("home");
                      }}
                    >
                      {b.ctaText || b.cta}
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>

        {banners.length > 1 && (
          <div className="hero-dots">
            {banners.map((_, i) => (
              <button
                key={i}
                className={i === heroIndex ? "active" : ""}
                onClick={() => setHeroIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      <section
        className="hero-trust-wrap"
        aria-label="ShopVibe shopping benefits"
      >
        <div className="hero-trust-strip">
          {[
            [Truck, "Free Shipping", "On eligible orders"],
            [ShieldCheck, "Secure Payments", "Protected checkout"],
            [RotateCcw, "Easy Returns", "Hassle-free support"],
            [Headphones, "24/7 Support", "We’re here for you"],
          ].map(([Icon, title, subtitle]) => (
            <article key={title}>
              <span>
                <Icon size={20} />
              </span>

              <div>
                <b>{title}</b>
                <small>{subtitle}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="category-shell container">
        <div
          className="category-scroll no-scrollbar"
          ref={categoryRef}
          onMouseEnter={() => setCategoryPaused(true)}
          onMouseLeave={() => setCategoryPaused(false)}
          onTouchStart={() => setCategoryPaused(true)}
          onTouchEnd={() =>
            window.setTimeout(() => setCategoryPaused(false), 1200)
          }
        >
          {categories.map((category) => {
            const count = Number(
              category.raw?.productCount ||
                catalogProducts.filter(
                  (p) =>
                    p.categoryRef === category.id ||
                    p.category === category.label,
                ).length ||
                0,
            );

            return (
              <article
                className="category-card"
                key={category.id}
                onClick={() => openCategory(category)}
              >
                <div className="category-icon">{categoryIcon(category)}</div>

                <div className="category-info">
                  <div>
                    <h3>{category.label}</h3>

                    <span>({count})</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      openCategory(category);
                    }}
                  >
                    Show all
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Side Category Bar */}

      {catalogError && (
        <div className="container api-error">{catalogError}</div>
      )}

      {catalogLoading && !catalogProducts.length ? (
        <div className="container api-loading">
          Loading live ShopVibe catalog…
        </div>
      ) : (
        <main className="container store-layout">
          <aside className="sidebar-column">
            <div className="sidebar-sticky">
              {/* CATEGORY */}
              <div className="sidebar-card">
                <h3>Category</h3>

                {categories.slice(0, 9).map((c) => (
                  <button
                    className="sidebar-category"
                    key={c.id}
                    onClick={() => openCategory(c)}
                  >
                    <span className="sidebar-category-icon">
                      {categoryIcon(c)}
                      {c.label}
                    </span>

                    <b>+</b>
                  </button>
                ))}
              </div>

              {/* BEST SELLERS */}
              <div
                className="best-seller"
                onMouseEnter={() => setBestSellerPaused(true)}
                onMouseLeave={() => setBestSellerPaused(false)}
                onTouchStart={() => setBestSellerPaused(true)}
                onTouchEnd={() =>
                  window.setTimeout(() => setBestSellerPaused(false), 1200)
                }
              >
                <h3>Best Sellers</h3>

                <div
                  className="best-seller-list"
                  key={`best-seller-${bestSellerIndex}`}
                >
                  {visibleBestSellers.map((p) => (
                    <article
                      key={p.id}
                      onClick={() => setPage("product", p.id)}
                    >
                      <img src={p.image} alt={p.name} />

                      <div>
                        <h4>{p.name}</h4>

                        <Rating rating={p.rating} />

                        <div>
                          {p.originalPrice > p.price && (
                            <del>{money(p.originalPrice)}</del>
                          )}{" "}
                          <b>{money(p.price)}</b>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="content-column">
            <div className="mini-groups">
              {[
                ["New Arrivals", newArrivals],

                ["Trending", trending],

                ["Top Rated", topRated],
              ].map(([title, items]) => (
                <section key={title}>
                  <h2>{title}</h2>

                  <div className="mini-list">
                    {items.map((p) => (
                      <article
                        className="mini-product"
                        key={p.id}
                        onClick={() => setPage("product", p.id)}
                      >
                        <img src={p.image} alt={p.name} />

                        <div>
                          <h3>{p.name}</h3>

                          <p>{p.brand || p.category}</p>

                          <div>
                            <b>{money(p.price)}</b>

                            {p.originalPrice > p.price && (
                              <del>{money(p.originalPrice)}</del>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {deal && (
              <section className="deal">
                <h2>Deal Of The Day</h2>

                <article
                  className={`deal-card ${dealAdded ? "cart-added" : ""}`}
                >
                  <div className="deal-image">
                    <img ref={dealImageRef} src={deal.image} alt={deal.name} />
                  </div>

                  <div className="deal-info">
                    <Rating rating={deal.rating} />

                    <h3>{deal.name.toUpperCase()}</h3>

                    <p>
                      {deal.description ||
                        "A standout ShopVibe pick from your live product catalog."}
                    </p>

                    <div className="deal-price">
                      <b>{money(deal.price)}</b>

                      {deal.originalPrice > deal.price && (
                        <del>{money(deal.originalPrice)}</del>
                      )}
                    </div>

                    <button
                      onClick={() => void addDeal()}
                      disabled={dealAdding}
                    >
                      {dealAdding
                        ? "ADDING…"
                        : dealAdded
                          ? "✓ ADDED"
                          : "ADD TO CART"}
                    </button>

                    <div className="stock">
                      <div>
                        <span>
                          Already sold: <b>{Math.max(1, deal.reviews || 12)}</b>
                        </span>

                        <span>
                          Available: <b>{deal.stock}</b>
                        </span>
                      </div>

                      <i>
                        <u
                          style={{
                            width: `${Math.min(94, Math.max(12, 100 - (deal.stock || 20)))}%`,
                          }}
                        />
                      </i>
                    </div>

                    <h4>HURRY UP! OFFER ENDS IN:</h4>

                    <div className="countdown">
                      {[
                        [days, "Days"],

                        [hours, "Hours"],

                        [mins, "Min"],

                        [secs, "Sec"],
                      ].map(([v, l]) => (
                        <div key={l}>
                          <b>{String(v).padStart(2, "0")}</b>

                          <span>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </section>
            )}

            <section id="products" className="products-section">
              <h2>New Products</h2>

              {featured.length ? (
                <div className="product-grid">
                  {featured.map((p) => (
                    <ProductCard product={p} key={p.id} />
                  ))}
                </div>
              ) : (
                <div className="api-empty">
                  No products returned by the API yet.
                </div>
              )}
            </section>
          </div>
        </main>
      )}

      <div className="container">
        <section className="experience-grid">
          <div className="testimonial">
            <h2>Testimonial</h2>

            <div className="testimonial-card">
              <div className="testimonial-avatar">SV</div>

              <h3>SHOPVIBE CUSTOMER</h3>

              <p>Verified shopper</p>

              <div
                style={{
                  fontSize: 24,

                  color: "var(--accent)",

                  margin: "14px auto",
                }}
              >
                “
              </div>

              <blockquote>
                Premium products, smooth browsing and a checkout experience that
                feels effortless.
              </blockquote>
            </div>
          </div>

          <div className="cta">
            {bannerImage(hero) ? (
              <img src={bannerImage(hero)} alt="Collection" />
            ) : (
              deal && <img src={deal.image} alt="Collection" />
            )}

            <div>
              <span>Premium edit</span>

              <h2>Season Collection</h2>

              <p>Live catalog, updated by API</p>

              <button onClick={() => setPage("shop")}>Shop now</button>
            </div>
          </div>

          <div className="services">
            <h2>Our Services</h2>

            <div className="service-card">
              {[
                [Truck, "Worldwide Delivery", "Fast dispatch"],

                [Rocket, "Quick Processing", "Tracked orders"],

                [Headphones, "Online Support", "Customer-first help"],

                [RotateCcw, "Return Policy", "Easy returns"],

                [ShieldCheck, "Secure Checkout", "Protected payments"],
              ].map(([Icon, title, sub]) => (
                <div key={title}>
                  <Icon size={28} />

                  <span>
                    <b>{title}</b>

                    <small>{sub}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="blog-grid">
          {catalogProducts.slice(0, 4).map((p, i) => (
            <article key={p.id} onClick={() => setPage("product", p.id)}>
              <div className="blog-img">
                <img src={p.image} alt={p.name} />
              </div>

              <p>{p.category}</p>

              <h3>{p.name}</h3>

              <small>ShopVibe Edit / #{i + 1}</small>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
