# MERN E-commerce Backend — Phase 3

Production-hardened Express/MongoDB backend with secure HTTP-only cookie authentication, product variants, category management, reviews, persistent cart, wishlist, address book, coupons, order lifecycle, inventory audit, Razorpay verification/webhooks, Cloudinary media, email verification/notifications, admin analytics and operational diagnostics.

## Quick start

```bash
npm install
copy .env.example .env
npm run check
npm run dev
```

API base: `http://localhost:8000/api/v1`

## MongoDB checkout mode

Recommended:

```env
MONGO_TRANSACTIONS=auto
```

The backend detects MongoDB topology at startup. Standalone MongoDB uses a compensating checkout implementation; Atlas/replica sets use multi-document transactions automatically.

You can inspect the detected mode after admin login through:

```text
GET /api/v1/admin/system
```

or the test frontend's **Admin -> System** tab.

## Operational commands

```bash
npm run check
npm test
npm run smoke       # requires a running backend
npm run db:indexes  # connects to DB and ensures model indexes
```

For an optional real checkout integration test:

```powershell
$env:DB_URI_TEST="mongodb://127.0.0.1:27017/Ecommerce_test"
npm test
```

## Production

Use Node 20+, HTTPS, a long unique JWT secret, a managed MongoDB replica set/Atlas, and hosting-provider secret storage. Run the root `npm run verify` and `npm run db:indexes` before release. Do not deploy `.env` through source control.
