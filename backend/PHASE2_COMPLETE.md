# Phase 2 – Complete E-commerce Backend Upgrade

This version builds on the hardened Phase 1 backend and adds the missing commerce systems needed for a serious portfolio/deployment project.

## Implemented in Phase 2

### Validation and API safety
- Zod request validation middleware.
- Validated registration/login, product create/update, categories, coupons, shipping/order payloads and addresses.
- Existing centralized error handling, Helmet, HPP, CORS, rate limits, cookie auth and origin guard remain in place.

### Product catalogue
- Category CRUD with safe category deletion rules.
- Brand and SKU fields.
- Product variants with SKU, attribute map, variant price, variant image, active flag and variant-level stock.
- Checkout requires a variant selection when active variants exist.
- Low-stock threshold support.
- Cloudinary image upload/delete endpoints using memory uploads (no temporary image files written to disk).

### Customer commerce
- Persistent MongoDB cart.
- Cart quantity/update/remove/clear APIs.
- Server-generated cart quote.
- Wishlist APIs.
- Saved address book with default-address handling.
- Coupon engine with percentage/fixed discounts, minimum order, max discount, start/end dates, total usage limit and per-user usage limit.

### Checkout/orders/inventory
- Server remains the source of truth for price/tax/shipping/discounts.
- Variant-aware inventory reservation/restoration.
- MongoDB transaction checkout when `MONGO_TRANSACTIONS=true`.
- Inventory audit log.
- Admin manual inventory adjustments.
- Low-stock admin API.
- User cancellation while order is still Processing.
- Refund + stock restoration on cancellation.
- Coupon usage bookkeeping.
- Order status history.
- Order confirmation/status email notifications.

### Identity
- Email-verification token flow.
- Resend verification endpoint.
- Optional `REQUIRE_EMAIL_VERIFICATION=true` production policy.

### Payments
- Existing Razorpay order creation and server-side payment verification retained.
- Raw-body Razorpay webhook endpoint with HMAC verification.
- Webhook event idempotency storage.
- Payment captured/failed/refunded synchronization.

### Admin and operations
- Dashboard analytics: order status, revenue, daily revenue, top products, user/product counts and low-stock count.
- Structured Pino HTTP logging with sensitive headers redacted.
- Swagger UI at `/api/v1/docs`.
- OpenAPI JSON at `/api/v1/openapi.json`.
- GitHub Actions CI template.
- Project-wide syntax/import checker.
- Docker support retained.

## Important production notes

1. Rotate all secrets that existed in the original project.
2. Use MongoDB Atlas or another replica-set deployment when `MONGO_TRANSACTIONS=true`.
3. For a local standalone MongoDB server, set `MONGO_TRANSACTIONS=false`.
4. Configure Razorpay webhook URL as `https://YOUR_API/api/v1/payment/webhook` and set the same secret in `RAZORPAY_WEBHOOK_SECRET`.
5. Configure Cloudinary credentials before using media endpoints.
6. Configure SMTP before relying on verification/order emails.
7. Keep `.env` out of Git.
8. Run `npm audit` after installing dependencies locally/CI.

## Main new endpoints

- `GET /api/v1/categories`
- `GET|POST /api/v1/admin/categories`
- `PUT|DELETE /api/v1/admin/categories/:id`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PUT|DELETE /api/v1/cart/items/:productId`
- `POST /api/v1/cart/quote`
- `DELETE /api/v1/cart`
- `GET /api/v1/wishlist`
- `POST|DELETE /api/v1/wishlist/:productId`
- `GET|POST /api/v1/addresses`
- `PUT|DELETE /api/v1/addresses/:id`
- `POST /api/v1/coupon/validate`
- `GET|POST /api/v1/admin/coupons`
- `PUT|DELETE /api/v1/admin/coupons/:id`
- `POST /api/v1/order/:id/cancel`
- `GET /api/v1/verify-email/:token`
- `POST /api/v1/verify-email/resend`
- `POST /api/v1/payment/webhook`
- `GET /api/v1/admin/analytics`
- `PATCH /api/v1/admin/inventory/:productId`
- `GET /api/v1/admin/inventory/history`
- `GET /api/v1/admin/inventory/low-stock`
- `POST /api/v1/admin/media/images`
- `DELETE /api/v1/admin/media/image`
- `GET /api/v1/docs`

## Still requires real-environment verification

Code-level implementation is included, but deployment readiness cannot be proven only by static checks. Before production, run the test suite and manually test with the actual MongoDB cluster, SMTP account, Cloudinary account, Razorpay test/live configuration and React frontend. Also perform dependency audit after `npm install`.
