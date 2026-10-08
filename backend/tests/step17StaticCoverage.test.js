import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function mustMatch(source, patterns) {
  for (const pattern of patterns) assert.match(source, pattern);
}

test("T-174 authentication automated coverage: validation, rate limits, password/reset and session protections are wired", async () => {
  const routes = await read("routes/userRoutes.js");
  const controller = await read("controller/userController.js");
  const auth = await read("middleware/userAuth.js");
  const jwt = await read("utils/jwtToken.js");
  const model = await read("models/userModel.js");

  mustMatch(routes, [
    /\/register["'],\s*authLimiter,\s*validate\(authSchemas\.register\)/,
    /\/login["'],\s*authLimiter,\s*validate\(authSchemas\.login\)/,
    /\/forgot\/password["'],\s*passwordResetLimiter/,
    /\/reset\/:token["'],\s*passwordResetLimiter/,
    /\/profile["'],\s*verifyUserAuth/,
  ]);
  mustMatch(controller, [
    /Invalid email or password/,
    /genericMessage\s*=\s*["']If an account exists/,
    /generatePasswordResetToken/,
    /generateEmailVerificationToken/,
  ]);
  mustMatch(auth, [/jwt\.verify/, /changedPasswordAfter/, /User\.findById/]);
  mustMatch(jwt, [/httpOnly:\s*true/, /secure:/, /sameSite(?:\s*:|\s*,)/]);
  mustMatch(model, [
    /bcrypt/,
    /select:\s*false/,
    /verifyPassword/,
    /changedPasswordAfter/,
  ]);
});

test("T-175 product automated coverage: CRUD validation, search/pagination, variants, reviews and Cloudinary cleanup exist", async () => {
  const routes = await read("routes/productRoutes.js");
  const controller = await read("controller/productController.js");
  const schemas = await read("validators/schemas.js");
  const api = await read("utils/apiFunctionality.js");

  mustMatch(routes, [
    /router\.get\(["']\/products["']/,
    /validate\(productCreateSchema\)/,
    /validate\(productCreateSchema\.partial\(\)\)/,
    /roleBasedAccess\(["']admin["']\)/,
    /\/review["']/,
    /\/reviews["']/,
  ]);
  mustMatch(schemas, [
    /variants:\s*z\.array/,
    /stock:\s*z\.coerce\.number\(\)\.int\(\)\.min\(0\)/,
    /images:\s*z\s*\.array\s*\(/,
  ]);
  mustMatch(api, [/pagination/, /search/, /filter/]);
  mustMatch(controller, [
    /cleanupCloudinaryImages/,
    /deleteCloudinaryImage/,
    /reviews/,
    /averageRating|rating/i,
  ]);
});

test("T-176 cart automated coverage: ownership, quantity bounds, stock checks, clear and quote paths exist", async () => {
  const routes = await read("routes/cartRoutes.js");
  const controller = await read("controller/cartController.js");
  const service = await read("services/cartService.js");

  mustMatch(routes, [
    /\/cart["'],\s*verifyUserAuth/,
    /\/cart\/items["'],\s*verifyUserAuth/,
    /\/cart\/quote["'],\s*verifyUserAuth/,
  ]);
  mustMatch(controller, [
    /Cart\.findOne\(\{\s*user:\s*req\.user\._id\s*\}\)/,
    /Quantity must be 1-99/,
    /Only \$\{availableStock\} item\(s\) are available/,
    /items:\s*\[\]/,
    /buildOrderQuote/,
  ]);
  mustMatch(service, [
    /quantity\s*<\s*1\s*\|\|\s*quantity\s*>\s*99/,
    /Insufficient stock/,
    /variantSku/,
  ]);
});

test("T-177 wishlist automated coverage: authenticated user-scoped add/list/remove logic exists", async () => {
  const routes = await read("routes/wishlistRoutes.js");
  const controller = await read("controller/wishlistController.js");
  mustMatch(routes, [
    /\/wishlist["'],\s*verifyUserAuth/,
    /\/wishlist\/:productId["'],\s*verifyUserAuth/,
  ]);
  mustMatch(controller, [
    /user:\s*req\.user\._id/,
    /findOneAndUpdate|findOne/,
    /\$addToSet|includes|some/,
    /\$pull|filter/,
  ]);
});

test("T-178 coupon automated coverage: validation, lifecycle limits, server quote and atomic global usage are present", async () => {
  const schemas = await read("validators/schemas.js");
  const routes = await read("routes/couponRoutes.js");
  const controller = await read("controller/couponController.js");
  const cart = await read("services/cartService.js");
  const persistence = await read("services/orderPersistenceService.js");

  mustMatch(schemas, [
    /Percent coupon cannot exceed 100/,
    /Coupon expiry must be after the start date/,
    /perUserLimit/,
    /usageLimit/,
  ]);
  mustMatch(routes, [
    /\/coupon\/validate["'],\s*verifyUserAuth/,
    /roleBasedAccess\(["']admin["']\)/,
  ]);
  mustMatch(controller, [/couponSchema\.safeParse\(mergedCoupon\)/]);
  mustMatch(cart, [
    /coupon\.expiresAt/,
    /coupon\.usageLimit/,
    /coupon\.perUserLimit/,
    /maxDiscountAmount/,
    /buildOrderQuote/,
  ]);
  mustMatch(persistence, [
    /filter\.usedCount\s*=\s*\{\s*\$lt:/,
    /\$inc:\s*\{\s*usedCount:\s*1\s*\}/,
  ]);
});

test("T-179 order automated coverage: authenticated ownership, idempotency, server totals, transactions/rollback and cancellation rules exist", async () => {
  const routes = await read("routes/orderRoutes.js");
  const controller = await read("controller/orderController.js");
  const persistence = await read("services/orderPersistenceService.js");
  const cart = await read("services/cartService.js");

  mustMatch(routes, [
    /\/new\/order["'],\s*verifyUserAuth,\s*validate\(orderCreateSchema\)/,
    /\/order\/:id["'],\s*verifyUserAuth/,
    /roleBasedAccess\(["']admin["']\)/,
  ]);
  mustMatch(controller, [
    /Idempotency-Key|idempotency/i,
    /buildOrderQuote/,
    /paymentMethod/,
    /findOne\(\{\s*_id:\s*req\.params\.id,\s*user:\s*req\.user\._id\s*\}\)/,
    /Only processing orders can be cancelled/,
  ]);
  mustMatch(persistence, [
    /withTransaction/,
    /persistWithCompensation/,
    /restoreInventory/,
    /clearCartBestEffort/,
  ]);
  mustMatch(cart, [/reserveInventory/, /stock:\s*\{\s*\$gte:/]);
});

test("T-180 payment code coverage: server-side amount/signature verification and webhook deduplication exist; live gateway execution is intentionally external", async () => {
  const service = await read("services/paymentService.js");
  const controller = await read("controller/paymentController.js");
  const routes = await read("routes/paymentRoutes.js");
  mustMatch(routes, [/\/payment\/order["'],\s*verifyUserAuth/]);
  mustMatch(service, [
    /createHmac\(["']sha256["']/,
    /timingSafeEqual/,
    /expectedAmountPaise/,
    /payment\.status\s*!==\s*["']captured["']/,
    /Razorpay is not configured on the server/,
  ]);
  mustMatch(controller, [
    /x-razorpay-signature/,
    /timingSafeEqual/,
    /PaymentEvent\.findOne/,
    /duplicate:\s*true/,
    /refund\.processed/,
  ]);
});

test("T-181 inventory automated coverage: negative stock protection, atomic reservation, variant support and audit logs exist", async () => {
  const service = await read("services/inventoryService.js");
  const cart = await read("services/cartService.js");
  const controller = await read("controller/inventoryController.js");
  mustMatch(service, [
    /Number\.isInteger\(delta\)/,
    /newStock\s*<\s*0/,
    /InventoryLog\.create/,
    /variantSku/,
  ]);
  mustMatch(cart, [
    /\$gte:\s*item\.quantity/,
    /\$inc/,
    /InventoryLog\.create/,
    /restoreInventory/,
  ]);
  mustMatch(controller, [
    /lowStockProducts/,
    /lowStockThreshold/,
    /limit\s*=\s*Math\.min/,
  ]);
});

test("T-182 permission automated coverage: admin routes require authentication and role authorization; user resources are owner-scoped", async () => {
  const admin = await read("routes/adminRoutes.js");
  const userRoutes = await read("routes/userRoutes.js");
  const productRoutes = await read("routes/productRoutes.js");
  const categoryRoutes = await read("routes/categoryRoutes.js");
  const couponRoutes = await read("routes/couponRoutes.js");
  const orderRoutes = await read("routes/orderRoutes.js");
  const auth = await read("middleware/userAuth.js");
  const orderController = await read("controller/orderController.js");
  const addressController = await read("controller/addressController.js");

  mustMatch(admin, [
    /router\.use\(["']\/admin["'],\s*verifyUserAuth,\s*roleBasedAccess\(["']admin["']\)\)/,
  ]);
  for (const src of [
    userRoutes,
    productRoutes,
    categoryRoutes,
    couponRoutes,
    orderRoutes,
  ]) {
    assert.match(src, /roleBasedAccess\(["']admin["']\)/);
  }
  mustMatch(auth, [/roles\.includes\(req\.user\.role\)/, /403/]);
  mustMatch(orderController, [/user:\s*req\.user\._id/]);
  mustMatch(addressController, [/User\.findById\(req\.user\._id\)/]);
});

test("T-183 validation automated coverage: Zod schemas enforce IDs, strings, ranges, enums and middleware replaces raw payload with parsed data", async () => {
  const schemas = await read("validators/schemas.js");
  const validate = await read("middleware/validate.js");
  const error = await read("middleware/error.js");

  mustMatch(schemas, [
    /\^\[a-f\\d\]\{24\}\$/,
    /z\.email\(\)/,
    /password:\s*z\.string\(\)\.min\(8\)\.max\(128\)/,
    /quantity:\s*z\.coerce\.number\(\)\.int\(\)\.min\(1\)\.max\(99\)/,
    /paymentMethod:\s*z\.enum\(\[["']COD["'],\s*["']RAZORPAY["']\]\)/,
    /z\.array\(variantSchema\)\.max\(100\)/,
  ]);
  mustMatch(validate, [
    /schema\.safeParse/,
    /Validation failed/,
    /req\[source\]\s*=\s*result\.data/,
  ]);
  mustMatch(error, [
    /CastError/,
    /ValidationError|validation/i,
    /413|entity\.too\.large/,
  ]);
});

test("T-184 integration test harness exists for real MongoDB COD checkout and is safely gated by DB_URI_TEST", async () => {
  const integration = await read("tests/checkout.integration.test.js");
  mustMatch(integration, [
    /DB_URI_TEST/,
    /safeTestDatabase/,
    /supertest/,
    /connectMongoDatabase/,
    /agent\.post\(["']\/api\/v1\/login["']\)/,
    /post\(["']\/api\/v1\/new\/order["']\)/,
    /idempotentReplay/,
    /stock,\s*2/,
    /disconnectMongoDatabase/,
  ]);
});
