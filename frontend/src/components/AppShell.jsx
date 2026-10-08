import { useEffect } from "react";
import { useStore } from "@/lib/store";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToastContainer from "@/components/reusable/Toast";
import PremiumCartDock from "@/components/reusable/PremiumCartDock";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import ForgotPasswordScreen from "@/screens/ForgotPasswordScreen";
import ResetPasswordScreen from "@/screens/ResetPasswordScreen";
import VerifyEmailScreen from "@/screens/VerifyEmailScreen";
import HomeScreen from "@/screens/HomeScreen";
import CategoriesScreen from "@/screens/CategoriesScreen";
import SubcategoryProductsScreen from "@/screens/SubcategoryProductsScreen";
import ProductScreen from "@/screens/ProductScreen";
import CartScreen from "@/screens/CartScreen";
import WishlistScreen from "@/screens/WishlistScreen";
import CheckoutScreen from "@/screens/CheckoutScreen";
import AddressScreen from "@/screens/AddressScreen";
import OrdersScreen from "@/screens/OrdersScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import AdminScreen from "@/screens/AdminScreen";
import NotFoundScreen from "@/screens/NotFoundScreen";

const FULL_PAGE_ROUTES = ["login", "register", "forgot", "reset", "verify"];
const PROTECTED_ROUTES = ["wishlist", "checkout", "addresses", "orders", "profile", "admin"];
const CART_DOCK_ROUTES = ["home", "shop", "categories", "subcategoryProducts", "product", "wishlist"];

function isKnownBrowserPath() {
  if (typeof window === "undefined") return true;
  const path = window.location.pathname;
  if (["/", "/shop", "/new-arrivals", "/categories", "/cart", "/wishlist", "/checkout", "/account", "/account/addresses", "/login", "/register", "/forgot-password"].includes(path)) return true;
  return ["/product/", "/subcategory/", "/account/orders", "/account/security", "/reset-password/", "/verify-email/", "/admin"].some(prefix => path.startsWith(prefix));
}

export default function AppShell() {
  const { currentPage, selectedProductId, selectedSubcategorySlug, isLoggedIn, authLoading, hydrateSession, syncPageFromLocation, setPage } = useStore();

  useEffect(() => {
    void hydrateSession();
    const onPop = () => syncPageFromLocation();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [hydrateSession, syncPageFromLocation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
    return () => window.cancelAnimationFrame(id);
  }, [currentPage, selectedProductId, selectedSubcategorySlug]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn && PROTECTED_ROUTES.includes(currentPage)) {
      if (typeof window !== "undefined") sessionStorage.setItem("shopvibe_after_login", currentPage === "checkout" ? "checkout" : "home");
      setPage("login");
    }
  }, [authLoading, isLoggedIn, currentPage, setPage]);

  const renderScreen = () => {
    switch (currentPage) {
      case "login": return <LoginScreen />;
      case "register": return <RegisterScreen />;
      case "forgot": return <ForgotPasswordScreen />;
      case "reset": return <ResetPasswordScreen />;
      case "verify": return <VerifyEmailScreen />;
      case "shop": return <CategoriesScreen mode="shop" />;
      case "newArrivals": return <CategoriesScreen mode="newArrivals" />;
      case "categories": return <CategoriesScreen mode="categories" />;
      case "subcategoryProducts": return <SubcategoryProductsScreen />;
      case "product": return <ProductScreen />;
      case "cart": return <CartScreen />;
      case "wishlist": return <WishlistScreen />;
      case "checkout": return <CheckoutScreen />;
      case "addresses": return <AddressScreen />;
      case "orders": return <OrdersScreen />;
      case "profile": return <ProfileScreen />;
      case "admin": return <AdminScreen />;
      default: return <HomeScreen />;
    }
  };

  if (!isKnownBrowserPath()) return <><NotFoundScreen /><ToastContainer /></>;

  if (authLoading && PROTECTED_ROUTES.includes(currentPage)) {
    return <div className="premium-session-loader"><span/><p>Checking your secure session…</p></div>;
  }

  if (FULL_PAGE_ROUTES.includes(currentPage)) return <>{renderScreen()}<ToastContainer /></>;
  if (currentPage === "admin") return <>{renderScreen()}<ToastContainer /></>;

  return <div className="premium-app-shell">
    <Navbar />
    <main className="flex-1">{renderScreen()}</main>
    <Footer />
    {CART_DOCK_ROUTES.includes(currentPage) && <PremiumCartDock />}
    <ToastContainer />
  </div>;
}
