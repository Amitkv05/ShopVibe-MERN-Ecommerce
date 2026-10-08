import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import ThemeToggle from "@/components/reusable/ThemeToggle";

export default function Navbar() {
  const {
    setPage,
    cart,
    wishlist,
    isLoggedIn,
    user,
    searchQuery,
    setSearchQuery,
    categories,
    fetchTaxonomy,
    setSelectedCategory,
  } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mega, setMega] = useState(false);

  useEffect(() => {
    if (!categories.length) void fetchTaxonomy().catch(() => {});
  }, [categories.length, fetchTaxonomy]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;
  const megaColumns = useMemo(() => categories.slice(0, 4), [categories]);

  const go = (page) => {
    setMobileOpen(false);
    setMega(false);
    setPage(page);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) go("shop");
  };

  const openCategory = (category) => {
    setSelectedCategory(category.label);
    go("categories");
  };

  return (
    <>
      <header className="site-header">
        <div className="main-head">
          <div className="container main-head-inner">
            <button
              type="button"
              className="brand"
              onClick={() => go("home")}
              aria-label="ShopVibe home"
            >
              <strong style={{ fontSize: 24, letterSpacing: "-.04em" }}>
                Shop<span style={{ color: "var(--accent-strong)" }}>Vibe</span>
              </strong>
            </button>

            <form className="searchbox" onSubmit={submitSearch}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your product name..."
              />
              <button type="submit" aria-label="Search">
                <Search size={20} />
              </button>
            </form>

            <div className="head-actions">
              <ThemeToggle />
              <button
                type="button"
                aria-label="Wishlist"
                className="badge-btn"
                onClick={() => go("wishlist")}
              >
                <Heart size={23} />
                {wishlistCount > 0 && <b>{wishlistCount}</b>}
              </button>
              <button
                type="button"
                aria-label="Cart"
                className="badge-btn"
                onClick={() => go("cart")}
              >
                <ShoppingBag size={23} />
                {cartCount > 0 && <b>{cartCount}</b>}
              </button>
              <button
                type="button"
                aria-label="Account"
                className="header-account-btn"
                onClick={() => go(isLoggedIn ? "profile" : "login")}
                title={isLoggedIn ? user?.name : "Login"}
              >
                <User size={23} />
                {isLoggedIn && (
                  <span className="header-account-label">
                    {user?.name || "User"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <nav className="desktop-nav">
          <div className="container nav-inner">
            <button className="nav-link" onClick={() => go("home")}>
              Home
            </button>
            <button
              className="nav-link"
              onMouseEnter={() => setMega(true)}
              onMouseLeave={() => setMega(false)}
              onClick={() => go("categories")}
            >
              Categories
            </button>
            <button className="nav-link" onClick={() => go("wishlist")}>
              Wishlist
            </button>

            {isLoggedIn && user?.role === "admin" && (
              <button
                className="nav-link admin-head-btn"
                onClick={() => go("admin")}
              >
                Admin
              </button>
            )}

            {mega && (
              <div
                className="mega-menu"
                onMouseEnter={() => setMega(true)}
                onMouseLeave={() => setMega(false)}
              >
                {(megaColumns.length
                  ? megaColumns
                  : [{ id: "fallback", label: "Categories", subcategories: [] }]
                ).map((category) => (
                  <div className="mega-column" key={category.id}>
                    <h4>{category.label}</h4>
                    {(category.subcategories || []).slice(0, 5).map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setMega(false);
                          useStore.getState().openSubcategory(sub.slug);
                        }}
                      >
                        {sub.label}
                      </button>
                    ))}
                    {!(category.subcategories || []).length && (
                      <button
                        type="button"
                        onClick={() => openCategory(category)}
                      >
                        Shop {category.label}
                      </button>
                    )}
                  </div>
                ))}
                <div className="mega-art">
                  <div className="mega-art-card">
                    <div>
                      <ShoppingBag size={34} />
                      <b>Fresh collection</b>
                      <p>Live products from your API</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      <button
        className="mobile-menu-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu />
      </button>
      <aside className={`mobile-drawer ${mobileOpen ? "open" : ""}`}>
        <div className="mobile-drawer-head">
          <strong>ShopVibe</strong>
          <button onClick={() => setMobileOpen(false)}>
            <X />
          </button>
        </div>
        <button onClick={() => go("home")}>
          Home <ChevronRight size={15} />
        </button>
        <button onClick={() => go("categories")}>
          Categories <ChevronRight size={15} />
        </button>
        <button onClick={() => go("wishlist")}>
          Wishlist <ChevronRight size={15} />
        </button>
        <button onClick={() => go("cart")}>
          Cart <ChevronRight size={15} />
        </button>
        <button onClick={() => go(isLoggedIn ? "profile" : "login")}>
          {isLoggedIn ? "My account" : "Login"} <ChevronRight size={15} />
        </button>
        {isLoggedIn && user?.role === "admin" && (
          <button onClick={() => go("admin")}>
            Admin Dashboard <ChevronRight size={15} />
          </button>
        )}
      </aside>
      {mobileOpen && (
        <button
          className="page-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}
    </>
  );
}
