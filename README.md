<div align="center">

# 🛍️ ShopVibe

### Production-Oriented MERN E-Commerce Platform

A full-stack e-commerce application featuring secure authentication, product variants, inventory-aware checkout, admin operations, cloud media, automated testing, monitoring, backup/recovery, and cloud deployment.

[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=for-the-badge)](https://github.com/Amitkv05/ShopVibe-MERN-Ecommerce/releases/tag/v1.0.0)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com/)

### 🌐 [Live Demo](https://shopvibe-mern-ecommerce-frontend.onrender.com)
### ❤️ [API Health](https://shopvibe-mern-ecommerce.onrender.com/api/v1/health)
### 📦 [Latest Release — v1.0.0](https://github.com/Amitkv05/ShopVibe-MERN-Ecommerce/releases/tag/v1.0.0)

</div>

---

## 📖 Overview

**ShopVibe** is a full-stack MERN e-commerce platform designed to demonstrate more than basic CRUD development.

The project covers the complete application lifecycle:

- Customer storefront
- Secure authentication
- Product and variant management
- Persistent cart and wishlist
- Address management
- Coupon and pricing engine
- Inventory-aware checkout
- Order processing
- Administrative operations
- Cloud media storage
- Email workflows
- Automated testing
- CI workflows
- Monitoring
- Database backup and recovery
- Cloud deployment

The application uses a modular architecture that separates frontend presentation, API communication, backend business logic, persistence, and external services.

---

## ✨ Key Highlights

### 🛍️ Complete Customer Experience

Customers can:

- Browse products and categories
- View new arrivals
- Search, filter, sort, and paginate products
- View detailed product information
- Select product variants such as size and color
- Add products to cart
- Maintain a persistent wishlist
- Manage multiple delivery addresses
- Apply coupons
- Complete Cash on Delivery checkout
- View orders and order details
- Manage their profile
- Verify their email
- Reset forgotten passwords

---

### 👨‍💼 Powerful Admin Platform

The admin interface includes management for:

- Dashboard
- Products
- Product variants
- Categories
- Banners
- Inventory
- Orders
- Customers
- Coupons
- Reviews
- Analytics
- System diagnostics

Admins can create both **simple products** and **products with variants**, including variant-specific SKUs and inventory.

---

## 🧠 Engineering Beyond CRUD

ShopVibe focuses on real e-commerce engineering concerns including:

- Server-authoritative pricing
- Checkout-time stock validation
- Duplicate-order prevention
- Idempotent order processing
- MongoDB transactions
- Concurrency protection
- Coupon validation
- Inventory consistency
- Rollback-safe checkout behavior
- Secure authentication cookies
- User data isolation
- API validation
- Health/readiness monitoring
- Database backup and restore verification

---

## 🧰 Technology Stack

### Frontend

| Technology | Usage |
|---|---|
| ReactJS | Component-based UI |
| Vite | Development and production build tooling |
| JavaScript / JSX | Frontend language |
| Zustand | Global state management |
| Tailwind CSS | Responsive styling |
| Lucide React | UI icons |
| History API | Custom SPA navigation |

### Backend

| Technology | Usage |
|---|---|
| Node.js | Server runtime |
| Express.js | REST API |
| MongoDB | Database |
| Mongoose | ODM / data modeling |
| Zod | Request validation |
| JWT | Authentication |
| HTTP-only Cookies | Secure session transport |
| Pino | Structured logging |
| Nodemailer | Email workflows |
| Cloudinary | Cloud media storage |

### Infrastructure

| Service | Purpose |
|---|---|
| MongoDB Atlas | Managed MongoDB database |
| Render | Frontend and backend deployment |
| Cloudinary | Product/category/banner media |
| GitHub | Source control and releases |
| GitHub Actions | CI validation |
| MongoDB Database Tools | Backup and restore |

---

## 🏗️ Architecture

```text
                        ┌──────────────────────┐
                        │      Customer        │
                        │       Browser        │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   React + Vite SPA   │
                        │ Zustand + Tailwind   │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  Central API Client  │
                        │ credentials included │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ Express REST API     │
                        │ Auth / Validation    │
                        │ Security Middleware  │
                        └──────────┬───────────┘
                                   │
                       ┌───────────┴────────────┐
                       ▼                        ▼
              ┌─────────────────┐      ┌─────────────────┐
              │ Controllers /   │      │ External        │
              │ Services        │      │ Services        │
              └────────┬────────┘      ├─────────────────┤
                       │               │ Cloudinary      │
                       ▼               │ SMTP / Email    │
              ┌─────────────────┐      │ Razorpay Layer  │
              │ Mongoose Models │      └─────────────────┘
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  MongoDB Atlas  │
              └─────────────────┘
```

---

## 🛒 Cart, Wishlist & Addresses

### Cart

- Persistent server-backed cart
- Product and variant support
- Quantity updates
- Remove individual items
- Clear cart
- Available-stock protection
- Checkout-time stock revalidation

### Wishlist

- Persistent wishlist
- Duplicate protection
- User-specific data isolation
- Add/remove product support

### Addresses

- Multiple delivery addresses
- Create, update, and delete
- Default address
- Checkout address selection
- User-level isolation

---

## 🎟️ Coupon & Pricing Engine

Pricing is calculated and validated on the **backend**, preventing the frontend from becoming the authority for order totals.

Supported coupon rules include:

- Percentage discounts
- Fixed-value discounts
- Minimum order amount
- Maximum discount limit
- Start and expiry dates
- Active/inactive states
- Global usage limits
- Per-user usage limits
- Checkout-time coupon revalidation

---

## 💳 Checkout & Order Safety

The current deployed demo supports **Cash on Delivery**.

Checkout includes:

- Fresh product validation
- Fresh inventory validation
- Coupon revalidation
- Server-side total calculation
- Order creation
- Inventory deduction
- Coupon usage tracking
- Cart cleanup after success
- Cart preservation after failure

### Idempotency

Order creation uses idempotency protection to prevent duplicate orders caused by:

- Double-clicks
- Network retries
- Browser retries
- Duplicate API requests

The same idempotency key does not create multiple logical orders.

### Transactions & Concurrency

Critical checkout operations use MongoDB transaction support.

Concurrency scenarios were tested to ensure:

- Inventory is deducted only once
- Stock never becomes negative
- Duplicate requests do not create duplicate orders
- Failed checkout operations preserve consistency

---

## 🔐 Authentication & Security

Authentication features include:

- Registration
- Login
- Logout
- Persistent session
- Email verification
- Verification resend
- Forgot password
- Password reset
- Profile management
- Password update

Security controls include:

- JWT authentication
- HTTP-only cookies
- Secure production cookie configuration
- SameSite cookie configuration
- Restricted CORS
- Helmet security headers
- Zod validation
- Rate limiting
- MongoDB operator protection
- Centralized error handling
- Request IDs
- Server-side pricing validation
- Server-side inventory validation
- Environment-based secret management

Authentication tokens are **not stored in browser Local Storage**.

---

## 📦 Inventory Management

ShopVibe supports inventory for both simple and variant-based products.

Features include:

- Simple product stock
- Variant-specific stock
- Variant SKUs
- Low-stock detection
- Out-of-stock handling
- Inventory logs
- Checkout-time stock validation
- Inventory restoration during supported cancellation/rollback flows

---

## ☁️ Media Management

Cloudinary is used for:

- Product images
- Category images
- Category icons
- Banner images

Upload validation is handled on the backend, including file-size protection.

---

## 📧 Email Workflows

Email functionality includes:

- Account email verification
- Verification resend
- Forgot-password email
- Password-reset flow

Sensitive reset/verification tokens are handled by the backend rather than being returned as normal API payload data.

---

## 👨‍💼 Admin Modules

| Module | Main Capabilities |
|---|---|
| Dashboard | Operational overview |
| Products | Simple/variant products, images, SKU, stock |
| Categories | Category management, images and icons |
| Banners | Marketing banners, CTA, ordering, positioning |
| Inventory | Stock management and activity |
| Orders | Order details and status management |
| Customers | Customer management |
| Coupons | Discount and usage rules |
| Reviews | Product review management |
| Analytics | Store statistics |
| System | Runtime and database diagnostics |

---

## 🧪 Testing & Quality Assurance

The project was tested across API, security, customer, admin, checkout, database, and deployment workflows.

### Backend Test Suite

```text
64 total tests
63 passed
0 failed
1 intentionally skipped
```

Covered areas include:

- Authentication
- Product APIs
- Categories
- Variants
- Reviews
- Inventory
- Cart
- Wishlist
- Addresses
- Coupons
- COD checkout
- Server-side pricing
- Idempotency
- Transactions
- Concurrency
- Rollback behavior
- Security
- Health endpoints
- Database capabilities

---

## ⚡ Lighthouse Results

Mobile Lighthouse optimization produced:

| Category | Score |
|---|---:|
| Performance | **97** |
| Accessibility | **94** |
| Best Practices | **96** |
| SEO | **100** |

### Core Metrics

| Metric | Result |
|---|---:|
| First Contentful Paint | 1.6s |
| Largest Contentful Paint | 2.4s |
| Total Blocking Time | 80ms |
| Cumulative Layout Shift | 0.031 |

---

## 📱 Responsive Experience

The application supports:

- Mobile
- Tablet
- Desktop

Both customer-facing screens and admin workflows were reviewed for responsive behavior.

Dark and light themes are supported across the application.

---

## ❤️ Health & Diagnostics

Backend health endpoints:

```text
GET /api/v1/health
GET /api/v1/health/live
GET /api/v1/health/ready
```

The admin system diagnostics also expose operational information such as:

- Application status
- Runtime information
- MongoDB connectivity
- Database latency
- Database topology
- Transaction support

### Live Health Endpoint

https://shopvibe-mern-ecommerce.onrender.com/api/v1/health

---

## 📊 Monitoring & Recovery

Operational readiness includes:

- Render deployment notifications
- Backend health checks
- MongoDB Atlas monitoring
- Database size alerting
- Connection monitoring
- Runtime logs
- Database diagnostics

### Backup & Restore

A MongoDB backup and restore rehearsal was successfully completed using MongoDB Database Tools.

```text
72 documents restored successfully
0 documents failed to restore
```

The test restore was performed against a separate database so the primary application database remained untouched.

Local database backup archives are excluded from Git.

---

## 🚀 Deployment

### Frontend

**Render Static Application**

https://shopvibe-mern-ecommerce-frontend.onrender.com

### Backend

**Render Node.js Service**

https://shopvibe-mern-ecommerce.onrender.com

### Database

**MongoDB Atlas**

### Media

**Cloudinary**

The deployed SPA also includes route rewrite handling so direct navigation and browser refresh work correctly on routes such as:

```text
/account
/shop
/categories
/cart
/wishlist
```

---

## 🖥️ Screenshots

<!--
Recommended:
Create the following folder inside the repository:

docs/screenshots/

Then add 4–6 strong screenshots such as:

docs/screenshots/home.png
docs/screenshots/product.png
docs/screenshots/cart.png
docs/screenshots/admin-dashboard.png
docs/screenshots/admin-product.png
docs/screenshots/mobile.png

After adding them, replace this comment with:

| Storefront | Product Details |
|---|---|
| ![Storefront](docs/screenshots/home.png) | ![Product](docs/screenshots/product.png) |

| Cart | Admin Dashboard |
|---|---|
| ![Cart](docs/screenshots/cart.png) | ![Admin](docs/screenshots/admin-dashboard.png) |

-->

Screenshots will be added to showcase the customer storefront, checkout flow, responsive interface, and admin dashboard.

---

## 📂 Project Structure

```text
ShopVibe-MERN-Ecommerce/
│
├── backend/
│   ├── controller/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── tests/
│   ├── docs/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── components/admin/
│   │   ├── components/reusable/
│   │   ├── screens/
│   │   ├── lib/
│   │   └── styles/
│   └── vite.config.js
│
├── shared/
├── scripts/
├── .github/
├── package.json
└── README.md
```

---

## ⚙️ Local Development

### Requirements

- Node.js 20+
- npm
- MongoDB / MongoDB Atlas
- Cloudinary account for media functionality
- SMTP credentials for email functionality

### 1. Clone

```bash
git clone https://github.com/Amitkv05/ShopVibe-MERN-Ecommerce.git
cd ShopVibe-MERN-Ecommerce
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Environment

Create the backend environment file from the safe example:

```bash
cp backend/.env.example backend/.env
```

Configure your own credentials locally.

Never commit the real `.env` file.

The frontend uses:

```text
VITE_API_URL
```

for its backend API base URL.

### 4. Start Development

```bash
npm run dev
```

Default local services:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8000
```

---

## ✅ Useful Development Checks

Run the complete validation pipeline:

```bash
npm run check
npm test
npm run build
```

Additional project-specific checks are available for areas such as:

- API contract compatibility
- Backend project validation
- Frontend integration
- Production build
- Runtime smoke testing

---

## 🔑 Environment Variables

The repository contains sanitized configuration examples.

Backend configuration includes areas such as:

```text
NODE_ENV
PORT
CLIENT_URL
API_URL

DB_URI

JWT_SECRET_KEY
JWT_EXPIRE

COOKIE_EXPIRE
COOKIE_SAME_SITE

SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
```

Real credentials must remain outside source control.

---

## 🌍 Environment-Specific Integrations

The current ShopVibe deployment is a stable portfolio/demo environment.

Some integrations require owner-managed production accounts and are connected when deploying for an actual business environment:

- Custom business domain
- Production DNS
- Razorpay live credentials
- Razorpay live webhook
- Controlled live payment verification
- Live refund verification
- Client/provider ownership transfer

The application architecture already contains the corresponding integration paths.

---

## 📚 Documentation

The repository/project documentation covers:

- Frontend architecture
- Backend architecture
- REST API
- Environment configuration
- Deployment
- Admin workflows
- Testing
- Monitoring
- Backup and restore
- Release process
- Production launch preparation
- Known environment-specific requirements

---

## 📦 Latest Release

### 🚀 v1.0.0

ShopVibe `v1.0.0` represents the first stable portfolio/demo release.

The release includes the customer storefront, admin platform, authentication, inventory-aware COD checkout, MongoDB transaction handling, Cloudinary media, email workflows, CI, deployment, monitoring, and backup/restore verification.

➡️ **[View complete v1.0.0 release notes](https://github.com/Amitkv05/ShopVibe-MERN-Ecommerce/releases/tag/v1.0.0)**

---

## 🎯 What This Project Demonstrates

ShopVibe demonstrates practical experience with:

- Full-stack MERN development
- React application architecture
- REST API design
- MongoDB modeling
- Authentication and authorization
- E-commerce business logic
- Inventory management
- Transaction-safe workflows
- Concurrency handling
- Cloud integrations
- Testing
- CI workflows
- Cloud deployment
- Monitoring
- Backup and disaster recovery
- Technical documentation

---

## 👨‍💻 Developer

**Amit Kumar**

Full-Stack / MERN Developer

GitHub: [Amitkv05](https://github.com/Amitkv05)

---

## 📌 Release Status

**Version:** `v1.0.0`  
**Type:** Stable Portfolio / Demo Release  
**Frontend:** Deployed ✅  
**Backend:** Deployed ✅  
**Database:** MongoDB Atlas ✅  
**Monitoring:** Configured ✅  
**Backup & Restore:** Verified ✅  
**Custom Business Domain:** Environment-specific  
**Live Razorpay Processing:** Environment-specific  

---

<div align="center">

### ⭐ ShopVibe

**Secure commerce workflows • Full-stack architecture • Admin operations • Cloud deployment**

[Live Demo](https://shopvibe-mern-ecommerce-frontend.onrender.com) ·
[API Health](https://shopvibe-mern-ecommerce.onrender.com/api/v1/health) ·
[Release v1.0.0](https://github.com/Amitkv05/ShopVibe-MERN-Ecommerce/releases/tag/v1.0.0)

</div>
