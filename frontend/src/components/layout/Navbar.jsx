import { useState } from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import ThemeToggle from "@/components/reusable/ThemeToggle";

const navLinks = [
  { label: "Shop", page: "shop" },
  { label: "New Arrivals", page: "newArrivals" },
  { label: "Categories", page: "categories" },
];

export default function Navbar() {
  const {
    setPage,
    cart,
    wishlist,
    isLoggedIn,
    user,
    currentPage,
    setSearchQuery,
    searchQuery,
  } = useStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const goTo = (page) => {
    setPage(page);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <button
              type="button"
              onClick={() => goTo("home")}
              className="group flex items-center gap-2"
              aria-label="ShopVibe home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-200 dark:shadow-none">
                <ShoppingBag size={18} className="text-white" />
              </div>
              <span className="hidden bg-gradient-to-r from-violet-700 to-purple-600 bg-clip-text text-xl font-bold text-transparent sm:block">
                ShopVibe
              </span>
            </button>

            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <button
                  type="button"
                  key={link.page}
                  onClick={() => goTo(link.page)}
                  className={clsx(
                    "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                    currentPage === link.page
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  )}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {searchOpen ? (
                <div className="flex items-center gap-2 rounded-xl border border-violet-300 bg-gray-50 px-3 py-2 ring-2 ring-violet-100 dark:border-violet-700 dark:bg-gray-900 dark:ring-violet-950/60">
                  <Search size={16} className="shrink-0 text-violet-500" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        goTo("shop");
                        setSearchOpen(false);
                      }
                      if (event.key === "Escape") setSearchOpen(false);
                    }}
                    placeholder="Search products..."
                    className="w-40 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    aria-label="Close search"
                  >
                    <X size={16} className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="rounded-xl p-2.5 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
              )}

              <ThemeToggle />

              <button
                type="button"
                onClick={() => goTo(isLoggedIn ? "wishlist" : "login")}
                className="relative hidden rounded-xl p-2.5 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white sm:flex"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => goTo("cart")}
                className="relative rounded-xl p-2.5 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {isLoggedIn && user?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => goTo("admin")}
                  className="hidden rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70 md:flex"
                >
                  Admin
                </button>
              )}

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => goTo("profile")}
                  className="ml-1 flex items-center gap-2 rounded-xl py-1.5 pl-2 pr-3 transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white">
                    {(user?.name || "U").charAt(0)}
                  </div>
                  <span className="hidden max-w-[80px] truncate text-sm font-medium text-gray-700 dark:text-gray-200 sm:block">
                    {(user?.name || "User").split(" ")[0]}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goTo("login")}
                  className="ml-1 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:from-violet-700 hover:to-purple-800 dark:shadow-none"
                >
                  <User size={16} />
                  <span className="hidden sm:block">Sign In</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className="rounded-xl p-2.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {navLinks.map((link) => (
                <button
                  type="button"
                  key={link.page}
                  onClick={() => goTo(link.page)}
                  className={clsx(
                    "rounded-xl px-4 py-3 text-left text-sm font-medium transition-all",
                    currentPage === link.page
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                  )}
                >
                  {link.label}
                </button>
              ))}

              <div className="mt-2 flex gap-2 border-t border-gray-100 pt-2 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => goTo(isLoggedIn ? "wishlist" : "login")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Heart size={18} />
                  Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                </button>
                <button
                  type="button"
                  onClick={() => goTo("cart")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <ShoppingBag size={18} />
                  Cart {cartCount > 0 && `(${cartCount})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <div className="h-16" />
    </>
  );
}
