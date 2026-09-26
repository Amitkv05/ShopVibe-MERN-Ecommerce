ShopVibe — MERN E-Commerce Platform
A production-focused full-stack e-commerce application built with the MERN stack, featuring a complete customer shopping experience, an admin management system, secure authentication, inventory controls, coupons, checkout workflows, media uploads, automated quality checks, and staging deployment.
The project was designed not only as an e-commerce UI, but as an end-to-end full-stack system with emphasis on backend architecture, security, data consistency, API integration, testing, CI, and deployment readiness.
Live Staging
Service	URL
Frontend	https://shopvibe-mern-ecommerce-frontend.onrender.com
Backend API	https://shopvibe-mern-ecommerce.onrender.com
Health Check	https://shopvibe-mern-ecommerce.onrender.com/api/v1/health


The staging environment is intended for project review and testing. Production payment configuration is intentionally deferred until client-owned Razorpay credentials are available.

Tech Stack
Frontend
- ReactJS
- Vite
- JavaScript / JSX
- Zustand
- Tailwind CSS
- Lucide React
- REST API integration
- Responsive dark/light interface
Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- Zod validation
- Cloudinary
- Nodemailer
- Pino logging
Infrastructure & Workflow
- Git
- GitHub
- GitHub Actions CI
- Render
- MongoDB Atlas
- REST API architecture
- Environment-based configuration
- Automated release checks
Frontend note: ShopVibe uses ReactJS + Vite + JavaScript/JSX only. No Next.js or TypeScript is used in the frontend.

What ShopVibe Includes
Customer Experience
- User registration
- Secure login/logout
- Email verification
- Forgot/reset password flow
- Persistent authenticated sessions
- Product browsing
- Product search
- Filtering and sorting
- Category browsing
- New arrivals
- Product variants
- Product reviews and ratings
- Shopping cart
- Wishlist
- Multiple delivery addresses
- Coupon application
- Checkout
- Order history
- Responsive dark/light UI
Admin Dashboard
- Dashboard overview
- Product management
- Simple products
- Variant products
- Category management
- Category image and icon management
- Promotional banner management
- Inventory management
- Low-stock monitoring
- Order management
- Customer management
- Coupon management
- Review management
- Analytics
- System diagnostics
- Cloudinary-powered image uploads
Engineering Highlights
ShopVibe includes more than standard CRUD functionality. Several areas were implemented with production-style behavior in mind.
Secure Authentication
Authentication uses JWT with secure HTTP-only cookies.
The authentication system includes:
- Protected API routes
- Role-based authorization
- Admin-only endpoints
- Password hashing
- Email verification
- Password-reset tokens
- HTTP-only authentication cookies
- Secure production cookies
- SameSite cookie configuration
- Restricted CORS
- Rate limiting
- Request validation
- Security response headers
A protected request is authorized by the backend, not by frontend state alone.
Product & Variant System
ShopVibe supports both simple products and products with variants.
Simple Product
Product
├── SKU
├── Price
└── Stock
Product with Variants
Product
├── Attributes
│   ├── Size
│   └── Color
│
└── Variants
    ├── Combination
    ├── SKU
    ├── Price
    └── Stock
The admin product form provides a visual variant builder. Administrators can define attributes such as size and color, generate combinations, apply default stock, and edit individual variants without manually writing raw JSON.
Category Architecture
Categories use a database relationship while still supporting readable URLs and older product records.
Category Name
      ↓
Category Slug
      ↓
categoryRef
      ↓
Products
This makes the category system suitable for both user-friendly URLs and MongoDB relationships.
Cart & Wishlist
The customer cart and wishlist support:
- Add to cart
- Quantity updates
- Remove item
- Clear cart
- Cart persistence
- Stock validation
- Above-stock protection
- Variant-aware cart items
- Wishlist add/remove
- Duplicate wishlist protection
- User-specific data isolation
Coupon & Pricing Engine
Coupon rules are evaluated on the server instead of trusting totals calculated by the browser.
Supported rules include:
- Percentage discounts
- Fixed discounts
- Expiration dates
- Active/inactive state
- Minimum order requirements
- Maximum discount limits
- Global usage limits
- Per-user usage limits
The backend recalculates order totals, reducing the risk of client-side price manipulation.
Checkout & Data Consistency
Checkout is one of the most important backend areas in the project.
The implementation includes:
- Server-side total calculation
- Stock revalidation
- Coupon revalidation
- Duplicate submission protection
- Idempotency
- Atomic stock handling
- MongoDB transactions
- Rollback behavior
- Failed checkout cart preservation
- Successful checkout cart clearing
- Coupon usage rollback
- Coupon usage recording on success
- Stock deduction exactly once
- Overselling protection
MongoDB Atlas replica-set transactions are enabled for transaction-sensitive checkout operations.
Media Management
Cloudinary is used for image storage.
Stored media references use:
public_id
url
This allows the application to clean up replaced or deleted cloud assets instead of leaving orphaned images behind.
Cloudinary-backed media is used for:
- Products
- Categories
- Category icons
- Promotional banners
Banner Management
Admin users can manage homepage promotional banners with fields such as:
- Image
- Badge
- Title
- Subtitle
- CTA text
- CTA destination
- Active state
- Display order
- Overlay opacity
- Text position
- Text alignment
Banner data is persisted in MongoDB rather than being hard-coded into the frontend.
API Architecture
ShopVibe follows a separated REST API architecture.
Browser
   ↓
React Screen / Component
   ↓
Zustand Store
   ↓
API Client
   ↓
Express Route
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
Mongoose Model
   ↓
MongoDB Atlas
The backend separates responsibilities into:
Routes
Controllers
Services
Models
Middleware
Validators
Configuration
Utilities
This helps keep validation, authorization, business logic, persistence, and HTTP handling organized.
Project Structure
ShopVibe-MERN-Ecommerce/
│
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       └── ci.yml
│
├── backend/
│   ├── config/
│   ├── controller/
│   ├── docs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   ├── server.js
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   └── reusable/
│   │   ├── lib/
│   │   └── screens/
│   ├── scripts/
│   ├── Dockerfile
│   ├── vite.config.js
│   └── .env.example
│
├── shared/
│   └── API contract
│
├── docs/
│   ├── deployment guidance
│   ├── environment configuration
│   ├── API guide
│   ├── UAT checklist
│   ├── launch runbook
│   ├── backup / restore guidance
│   └── maintenance guidance
│
├── scripts/
├── README.md
├── START_HERE.md
├── package.json
└── package-lock.json
Testing & Quality Assurance
The project includes automated and manual checks across important application areas.
Coverage includes:
- Authentication
- Authorization
- Products
- Categories
- Product variants
- Reviews
- Inventory
- Cart
- Wishlist
- Addresses
- Coupons
- Pricing
- COD checkout
- MongoDB transactions
- Idempotency
- Concurrency
- Rollback behavior
- Security middleware
- API compatibility
- Frontend/backend integration
- Production build verification
The latest local regression run completed with:
64 tests
63 passed
0 failed
1 intentionally skipped
The skipped test requires a gated real-MongoDB runtime environment.
API Contract & Release Protection
The project includes a frozen API contract to reduce accidental breaking changes.
Release verification checks:
API Contract
     ↓
Backend Static Checks
     ↓
Frontend Integration Checks
     ↓
Automated Tests
     ↓
API Freeze Verification
     ↓
Production Build
     ↓
Release Readiness
The current API freeze baseline is maintained as a versioned release artifact.
Continuous Integration
GitHub Actions runs the project's automated CI workflow.
The CI pipeline verifies stages such as:
Checkout Source
      ↓
Install Dependencies
      ↓
API Contract Check
      ↓
Backend Check
      ↓
Frontend Integration Check
      ↓
Automated Tests
      ↓
Production Build
      ↓
Dependency Audit
This helps identify regressions before changes are considered release-ready.
Dependabot is also configured for dependency update pull requests, allowing dependency upgrades to be tested by CI before merging.
Performance & Lighthouse
The frontend was tested using a production Vite build.
A recent mobile Lighthouse run achieved:
Performance      97
Accessibility    94
Best Practices   96
SEO             100
Key performance metrics included:
FCP   1.6 s
LCP   2.4 s
TBT   80 ms
CLS   0.031
Further image optimization can improve delivery of placeholder/catalog imagery.
Environment Configuration
Real .env files are intentionally excluded from source control.
Backend
Create:
backend/.env
Use:
backend/.env.example
as the safe configuration reference.
Backend environment groups include:
- Application configuration
- CORS / frontend origins
- MongoDB Atlas
- JWT
- Authentication cookies
- Email verification
- Password reset
- SMTP
- Cloudinary
- Razorpay
- Pricing
- HTTP timeouts
- Logging
- Performance test configuration
Never commit real values for:
DB_URI
JWT_SECRET_KEY
SMTP_PASSWORD
CLOUDINARY_API_SECRET
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
Frontend
Create:
frontend/.env
Example for local development:
VITE_API_URL=http://localhost:8000/api/v1
Example for staging:
VITE_API_URL=https://shopvibe-mern-ecommerce.onrender.com/api/v1
Only browser-safe values belong in VITE_* variables because frontend environment values are bundled into browser code.
Local Development
Requirements
- Node.js 20+
- npm
- MongoDB / MongoDB Atlas
Clone
git clone <repository-url>
cd ShopVibe-MERN-Ecommerce
Install
The project uses npm workspaces, so dependencies can be installed from the repository root.
npm install
Run Verification
npm run check
npm test
npm run build
Start Development
npm run dev
Local services:
Frontend
http://localhost:5173

Backend
http://localhost:8000
Backend health:
http://localhost:8000/api/v1/health
Useful Commands
From the project root:
npm install
npm run dev
npm run check
npm test
npm run build
The backend also contains maintenance and verification scripts for areas such as:
- API freeze verification
- API baseline updates
- Runtime smoke testing
- Database index synchronization
- Performance testing
- Legacy compatibility migration
- Product/category synchronization
Staging Deployment
Current staging architecture:
                         User
                           │
                           ▼
              ReactJS + Vite Frontend
                         Render
                           │
                           │ HTTPS
                           │ REST API
                           ▼
               Node.js + Express API
                         Render
                       /        \
                      ▼          ▼
              MongoDB Atlas   Cloudinary
                      │
                      ▼
               Persistent Data

                 Additional Service
                        │
                        ▼
                      SMTP
Staging Frontend
https://shopvibe-mern-ecommerce-frontend.onrender.com
Staging Backend
https://shopvibe-mern-ecommerce.onrender.com
Backend Health
https://shopvibe-mern-ecommerce.onrender.com/api/v1/health
Frontend and backend are deployed independently so environment configuration, scaling, and deployment can be handled separately.
Authentication Across Staging Services
The frontend sends authenticated API requests with credentials enabled.
The backend controls:
CLIENT_URL
CLIENT_URLS
COOKIE_SAME_SITE
COOKIE_DOMAIN
NODE_ENV
For HTTPS staging, secure cookie and CORS configuration are applied through environment variables rather than hard-coded secrets or deployment-specific URLs.
Security Measures
The project includes multiple security controls:
- HTTP-only authentication cookies
- Secure production cookies
- SameSite cookie configuration
- JWT authentication
- Password hashing
- Role-based authorization
- Admin route protection
- Restricted credentialed CORS
- Helmet security headers
- Rate limiting
- Request validation
- MongoDB operator protection
- Request IDs
- Controlled error handling
- Environment-based secrets
- Secrets excluded from Git
- Server-side pricing validation
- Server-side stock validation
Payment Integration
Razorpay integration is wired into the backend architecture, including order creation and webhook handling.
However, live payment activation is intentionally deferred because the final merchant account should be owned by the client/business responsible for:
- KYC
- Bank settlement
- Refund ownership
- Transaction reporting
- Live API credentials
Payment testing can be completed later using the client-owned Razorpay account.
Release Workflow
ShopVibe follows a structured release process.
Development
     ↓
Local Regression Testing
     ↓
Git Commit
     ↓
GitHub
     ↓
GitHub Actions CI
     ↓
Staging Backend
     ↓
Staging Frontend
     ↓
Staging Smoke Test
     ↓
User Acceptance Testing
     ↓
Production Configuration
     ↓
Production Deployment
     ↓
Production Smoke Test
     ↓
Monitoring / Backup
     ↓
Client Handover
Current Release Status
Database final cleanup          ✅
Final local regression          ✅
Responsive / Lighthouse         ✅
GitHub private repository       ✅
GitHub Actions CI               ✅
Backend staging deployment      ✅
Frontend staging deployment     ✅
Staging authentication          ✅
Razorpay                        ⏸ Deferred to client account
Staging UAT                     Next
Production deployment           Pending
Production smoke test           Pending
Monitoring / backup             Pending
Client handover                 Pending
Documentation
The repository includes supporting documentation for:
- Deployment
- Environment variables
- API usage
- Admin workflows
- UAT
- Backup and restore
- Launch procedure
- Post-launch procedure
- Maintenance and support
- Known limitations
- External/client-required inputs
This makes the project easier to review, deploy, maintain, and hand over to another developer or client.
Why I Built This Project
The goal of ShopVibe was to go beyond creating a basic MERN CRUD application.
I wanted to practice the complete lifecycle of a modern full-stack application:
Requirement
    ↓
Architecture
    ↓
Frontend
    ↓
Backend APIs
    ↓
Database
    ↓
Authentication
    ↓
Security
    ↓
Transactions
    ↓
Testing
    ↓
CI
    ↓
Deployment
    ↓
Release Verification
The project helped strengthen practical experience with:
- React application architecture
- REST API development
- MongoDB data modeling
- Secure authentication
- Authorization
- Product variants
- Inventory consistency
- Checkout transactions
- API integration
- Error handling
- Automated testing
- Git workflow
- GitHub Actions
- Environment management
- Staging deployment
- Production-readiness thinking
Interview Talking Points
Full-stack ownership
The application includes both the customer/admin React frontend and the Node.js/Express backend.
Checkout consistency
Stock, coupons, order creation, idempotency, rollback, and MongoDB transactions were treated as one coordinated workflow.
Security
Authentication is server-controlled using JWT HTTP-only cookies, restricted CORS, secure production settings, role-based authorization, validation, rate limits, and security headers.
Production workflow
The project was taken through local regression testing, GitHub source control, CI, Lighthouse testing, environment separation, and real staging deployment.
Maintainability
The backend uses separated routes, controllers, services, models, middleware, validators, configuration, and utilities instead of placing all logic in route handlers.
Future Improvements
Possible future enhancements include:
- Client-owned Razorpay live activation
- Production custom domain
- Enhanced image optimization
- Automated end-to-end browser testing
- Expanded monitoring and alerting
- Advanced analytics
- Search indexing
- Product recommendations
- Redis-based caching where justified
- Background job processing for heavier workflows
Author
Amit Kumar
Full-Stack / MERN Developer
ReactJS
JavaScript
Node.js
Express.js
MongoDB
REST APIs
Git
GitHub
CI/CD
Project Summary
ShopVibe demonstrates a complete MERN e-commerce workflow from frontend development and backend API design through authentication, transactions, testing, CI, and staging deployment.
It represents a practical full-stack project built with an emphasis on real application behavior, maintainable architecture, release discipline, and production-readiness.
