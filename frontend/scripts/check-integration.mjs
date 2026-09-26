import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
const checks = [
  ["API client uses configurable Vite backend URL", () => /VITE_API_URL/.test(read("src/lib/api.js"))],
  ["Cookie auth sends credentials", () => /credentials:\s*["']include["']/.test(read("src/lib/api.js"))],
  ["Hardcoded product catalog removed", () => !/export\s+const\s+PRODUCTS\s*=/.test(read("src/lib/data.js"))],
  ["Hardcoded category catalog removed", () => !/export\s+const\s+CATEGORIES\s*=/.test(read("src/lib/data.js"))],
  ["Guest catalog uses live APIs", () => /fetchCatalog/.test(read("src/screens/HomeScreen.jsx")) && /fetchProducts/.test(read("src/screens/CategoriesScreen.jsx"))],
  ["Server-side product pagination wired", () => /productMeta/.test(read("src/lib/store.js")) && /totalPages/.test(read("src/screens/CategoriesScreen.jsx"))],
  ["Live product details API wired", () => /fetchProduct/.test(read("src/screens/ProductScreen.jsx"))],
  ["Product stock UI is live-data driven", () => /currentStock/.test(read("src/screens/ProductScreen.jsx")) && !/Only 8 left/.test(read("src/screens/ProductScreen.jsx"))],
  ["Real login/register/logout/profile session", () => /api\("\/login"/.test(read("src/lib/store.js")) && /api\("\/register"/.test(read("src/lib/store.js")) && /api\("\/logout"/.test(read("src/lib/store.js")) && /api\("\/profile"/.test(read("src/lib/store.js"))],
  ["Guest cart persistence exists", () => /GUEST_CART_KEY/.test(read("src/lib/store.js"))],
  ["Guest cart merge after login/register", () => /syncGuestCart/.test(read("src/lib/store.js"))],
  ["Server cart wired", () => /\/cart\/items/.test(read("src/lib/store.js"))],
  ["Wishlist wired", () => /\/wishlist\//.test(read("src/lib/store.js"))],
  ["Addresses wired", () => /\/addresses/.test(read("src/lib/store.js"))],
  ["COD/order creation wired", () => /\/new\/order/.test(read("src/lib/store.js")) && /Idempotency-Key/.test(read("src/lib/store.js"))],
  ["Server-side checkout quote wired", () => /\/cart\/quote/.test(read("src/screens/CheckoutScreen.jsx")) && /server-calculated pricing/.test(read("src/screens/CheckoutScreen.jsx"))],
  ["Razorpay frontend code wired without secrets", () => /\/payment\/order/.test(read("src/screens/CheckoutScreen.jsx")) && /checkout\.razorpay\.com/.test(read("src/screens/CheckoutScreen.jsx")) && /razorpaySignature/.test(read("src/screens/CheckoutScreen.jsx"))],
  ["Coupon quote/validation wired", () => /\/coupon\/validate/.test(read("src/screens/CartScreen.jsx"))],
  ["Order cancellation wired", () => /\/cancel/.test(read("src/lib/store.js"))],
  ["Review create/update wired", () => /api\("\/review"/.test(read("src/screens/ProductScreen.jsx"))],
  ["Forgot/reset/verify email screens exist", () => exists("src/screens/ForgotPasswordScreen.jsx") && exists("src/screens/ResetPasswordScreen.jsx") && exists("src/screens/VerifyEmailScreen.jsx")],
  ["Profile update/change-password/resend-verification wired", () => /\/profile\/update/.test(read("src/lib/store.js")) && /\/password\/update/.test(read("src/lib/store.js")) && /\/verify-email\/resend/.test(read("src/lib/store.js"))],
  ["Admin role guard exists", () => /user\?\.role\s*!==\s*["']admin["']/.test(read("src/screens/AdminScreen.jsx"))],
  ["Admin dashboard wired", () => exists("src/components/admin/AdminDashboard.jsx") && /\/admin\/analytics/.test(read("src/components/admin/AdminDashboard.jsx"))],
  ["Admin product CRUD + media wired", () => /\/admin\/products/.test(read("src/components/admin/AdminProducts.jsx")) && /\/admin\/media\/images/.test(read("src/components/admin/AdminProducts.jsx"))],
  ["Admin category CRUD + image/icon upload wired", () => /\/admin\/categories/.test(read("src/components/admin/AdminCategories.jsx")) && /Category Image/.test(read("src/components/admin/AdminCategories.jsx")) && /Category Icon/.test(read("src/components/admin/AdminCategories.jsx")) && /\/admin\/media\/images/.test(read("src/components/admin/AdminCategories.jsx"))],
  ["Admin inventory adjust/history wired", () => /\/admin\/inventory\//.test(read("src/components/admin/AdminInventory.jsx"))],
  ["Admin order transitions/delete wired", () => /\/admin\/order\//.test(read("src/components/admin/AdminOrders.jsx")) && /Mark shipped/.test(read("src/components/admin/AdminOrders.jsx"))],
  ["Admin customer edit/role/delete wired", () => /\/admin\/user\//.test(read("src/components/admin/AdminCustomers.jsx"))],
  ["Admin coupon CRUD wired", () => /\/admin\/coupons/.test(read("src/components/admin/AdminCoupons.jsx"))],
  ["Admin review moderation wired", () => /productId=/.test(read("src/components/admin/AdminReviews.jsx"))],
  ["Shared media upload/delete service remains available", () => /\/admin\/media\/images/.test(read("src/components/admin/AdminProducts.jsx")) && /\/admin\/media\/image/.test(read("src/components/admin/AdminCategories.jsx"))],
  ["Standalone Media tab removed from admin navigation", () => !/\["media",\s*"Media"/.test(read("src/screens/AdminScreen.jsx"))],
  ["Admin banner CRUD + movable text editor wired", () => exists("src/components/admin/AdminBanners.jsx") && /\/admin\/banners/.test(read("src/components/admin/AdminBanners.jsx")) && /onPointerMove/.test(read("src/components/admin/AdminBanners.jsx"))],
  ["Homepage loads persisted banners", () => /api\("\/banners"\)/.test(read("src/screens/HomeScreen.jsx"))],
  ["Navbar has only Shop, New Arrivals and Categories catalog links", () => /label: "Shop"/.test(read("src/components/layout/Navbar.jsx")) && /label: "New Arrivals"/.test(read("src/components/layout/Navbar.jsx")) && /label: "Categories"/.test(read("src/components/layout/Navbar.jsx")) && !/label: "Sale"/.test(read("src/components/layout/Navbar.jsx"))],
  ["Catalog routes have independent active pages", () => /shop: "\/shop"/.test(read("src/lib/store.js")) && /newArrivals: "\/new-arrivals"/.test(read("src/lib/store.js")) && /categories: "\/categories"/.test(read("src/lib/store.js"))],
  ["Visual variant builder replaces Variants JSON", () => /Product with Variants/.test(read("src/components/admin/AdminProducts.jsx")) && /Default stock per variant/.test(read("src/components/admin/AdminProducts.jsx")) && !/Variants JSON/.test(read("src/components/admin/AdminProducts.jsx"))],
  ["Admin analytics date-range UI wired", () => /\/admin\/analytics\?from=/.test(read("src/components/admin/AdminAnalytics.jsx"))],
  ["Admin system diagnostics wired", () => /\/admin\/system/.test(read("src/components/admin/AdminSystem.jsx"))],
  ["Admin deep-link tabs implemented", () => /history\.pushState/.test(read("src/screens/AdminScreen.jsx")) && /tabFromPath/.test(read("src/screens/AdminScreen.jsx"))],
  ["Vite SPA entry exists", () => exists("index.html") && exists("src/main.jsx") && exists("vite.config.js")],
  ["Dark/light theme is reusable and persistent", () => exists("src/components/reusable/ThemeProvider.jsx") && exists("src/components/reusable/ThemeToggle.jsx") && /shopvibe_theme/.test(read("src/components/reusable/ThemeProvider.jsx"))],
  ["Reusable generic UI is centralized", () => ["Badge.jsx", "Button.jsx", "Input.jsx", "StarRating.jsx", "Toast.jsx", "ThemeToggle.jsx"].every((name) => exists(`src/components/reusable/${name}`))],
  ["No bare alert/confirm globals remain", () => !/(^|[^.\w])(alert|confirm)\s*\(/m.test(fs.readdirSync(path.join(root, "src"), { recursive: true }).filter(x => typeof x === "string" && /\.(js|jsx)$/.test(x)).map(x => read(path.join("src", x))).join("\n"))],
  ["No backend secrets embedded in frontend", () => !/RAZORPAY_KEY_SECRET|CLOUDINARY_API_SECRET|JWT_SECRET_KEY|SMTP_PASSWORD|DB_URI=/.test(fs.readdirSync(path.join(root, "src"), { recursive: true }).filter(x => typeof x === "string" && /\.(js|jsx)$/.test(x)).map(x => read(path.join("src", x))).join("\n"))],
];
let fail = 0;
for (const [name, fn] of checks) { let ok = false; try { ok = Boolean(fn()); } catch { } console.log(`${ok ? "PASS" : "FAIL"} - ${name}`); if (!ok) fail++; }
console.log(`\n${checks.length - fail}/${checks.length} integration checks passed`);
process.exit(fail ? 1 : 0);
