import { useEffect } from "react";
import { useStore } from "@/lib/store";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToastContainer from "@/components/reusable/Toast";
import ThemeToggle from "@/components/reusable/ThemeToggle";
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
const FULL_PAGE_ROUTES = ["login", "register", "forgot", "reset", "verify"];
const PROTECTED_ROUTES = [
  "wishlist",
  "checkout",
  "addresses",
  "orders",
  "profile",
  "admin",
];
export default function AppShell() {
  const {
    currentPage,
    isLoggedIn,
    authLoading,
    hydrateSession,
    syncPageFromLocation,
    setPage,
  } = useStore();
  useEffect(() => {
    void hydrateSession();
    const onPop = () => syncPageFromLocation();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [hydrateSession, syncPageFromLocation]);
  useEffect(() => {
    if (!authLoading && !isLoggedIn && PROTECTED_ROUTES.includes(currentPage)) {
      if (typeof window !== "undefined")
        sessionStorage.setItem(
          "shopvibe_after_login",
          currentPage === "checkout" ? "checkout" : "home",
        );
      setPage("login");
    }
  }, [authLoading, isLoggedIn, currentPage, setPage]);
  const renderScreen = () => {
    switch (currentPage) {
      case "login":
        return <LoginScreen />;
      case "register":
        return <RegisterScreen />;
      case "forgot":
        return <ForgotPasswordScreen />;
      case "reset":
        return <ResetPasswordScreen />;
      case "verify":
        return <VerifyEmailScreen />;
      case "shop":
        return <CategoriesScreen mode="shop" />;
      case "newArrivals":
        return <CategoriesScreen mode="newArrivals" />;
      case "categories":
        return <CategoriesScreen mode="categories" />;
      case "subcategoryProducts":
        return <SubcategoryProductsScreen />;
      case "product":
        return <ProductScreen />;
      case "cart":
        return <CartScreen />;
      case "wishlist":
        return <WishlistScreen />;
      case "checkout":
        return <CheckoutScreen />;
      case "addresses":
        return <AddressScreen />;
      case "orders":
        return <OrdersScreen />;
      case "profile":
        return <ProfileScreen />;
      case "admin":
        return <AdminScreen />;
      default:
        return <HomeScreen />;
    }
  };
  if (authLoading && PROTECTED_ROUTES.includes(currentPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking your session…
      </div>
    );
  }
  if (FULL_PAGE_ROUTES.includes(currentPage))
    return (
      <>
        <ThemeToggle floating />
        {renderScreen()}
        <ToastContainer />
      </>
    );
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{renderScreen()}</main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
