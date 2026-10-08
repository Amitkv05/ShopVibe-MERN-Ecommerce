# ShopVibe CSS Structure

The previous mixed presentation files were consolidated into screen/domain-specific stylesheets.
A selector is owned by one stylesheet only, which prevents competing definitions across unrelated CSS files.

- `src/styles/globals.css` — Tailwind import/bridge, design tokens, resets, shared reusable UI and generic page helpers.
- `src/styles/layout.css` — Navbar, header, navigation, mobile drawer, shared storefront frame and footer.
- `src/styles/home.css` — Home hero, banner trust rail, category carousel, sidebar, deals and home sections.
- `src/styles/product.css` — Product cards and product-detail styling.
- `src/styles/catalog.css` — Category, subcategory and catalog browsing pages.
- `src/styles/cart.css` — Cart page, cart dock/drawer and add-to-cart visual feedback.
- `src/styles/checkout.css` — Checkout and order-flow button styling.
- `src/styles/auth.css` — Login/authentication presentation.
- `src/styles/account.css` — Profile, orders, wishlist and account-related presentation.
- `src/styles/not-found.css` — 404 screen.
- `src/styles/admin/` — Admin styles are split by screen (`admin.css`, `dashboard.css`, `analytics.css`, `products.css`, `categories.css`, `subcategories.css`, `banners.css`, `inventory.css`, `orders.css`, `customers.css`, `coupons.css`, `reviews.css`, `media.css`, `system.css`). `admin/index.css` is the single admin entry point.

Import order is defined once in `src/main.jsx`.

## Rule

Do not add the same selector to multiple stylesheet files. Put a selector in the file that owns the screen/component.
Responsive overrides for that selector should stay in the same file inside its media query.
