import test from "node:test";
import assert from "node:assert/strict";

const dbUri = process.env.DB_URI_TEST || "";
const safeTestDatabase = /(?:test|ci)/i.test(dbUri);

test("COD checkout works with MONGO_TRANSACTIONS=auto on the configured test MongoDB", { skip: !dbUri || !safeTestDatabase }, async () => {
  process.env.NODE_ENV = "test";
  process.env.DB_URI = dbUri;
  process.env.JWT_SECRET_KEY ||= "integration_test_secret_that_is_at_least_32_chars";
  process.env.CLIENT_URL ||= "http://localhost:5173";
  process.env.MONGO_TRANSACTIONS = "auto";
  process.env.REQUIRE_EMAIL_VERIFICATION = "false";
  process.env.TAX_RATE = "0";
  process.env.SHIPPING_FLAT_RATE = "0";

  const request = (await import("supertest")).default;
  const { connectMongoDatabase, disconnectMongoDatabase } = await import("../config/db.js");
  const { default: User } = await import("../models/userModel.js");
  const { default: Product } = await import("../models/productModel.js");
  const { default: Order } = await import("../models/orderModel.js");
  const { default: Cart } = await import("../models/cartModel.js");
  const { default: InventoryLog } = await import("../models/inventoryLogModel.js");
  const { default: app } = await import("../app.js");

  const marker = `phase3-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `${marker}@example.com`;
  let user;
  let product;

  try {
    await connectMongoDatabase();
    user = await User.create({ name: "Phase Three Test", email, password: "Password123!", isEmailVerified: true });
    product = await Product.create({
      name: `Checkout ${marker}`,
      description: "Phase 3 automated checkout integration fixture",
      price: 250,
      category: "Integration",
      stock: 3,
      user: user._id,
      active: true,
    });

    const agent = request.agent(app);
    const login = await agent.post("/api/v1/login").send({ email, password: "Password123!" });
    assert.equal(login.status, 200, login.text);

    const orderResponse = await agent
      .post("/api/v1/new/order")
      .set("Idempotency-Key", marker)
      .send({
        shippingInfo: {
          fullName: "Phase Three Test",
          address: "1 Integration Street",
          city: "Delhi",
          state: "Delhi",
          country: "India",
          pinCode: "110001",
          phoneNo: "9999999999",
        },
        orderItems: [{ product: product._id, quantity: 1 }],
        paymentMethod: "COD",
      });

    assert.equal(orderResponse.status, 201, orderResponse.text);
    assert.equal(orderResponse.body.success, true);
    assert.equal(orderResponse.body.order.totalPrice, 250);

    const freshProduct = await Product.findById(product._id);
    assert.equal(freshProduct.stock, 2);

    const replay = await agent
      .post("/api/v1/new/order")
      .set("Idempotency-Key", marker)
      .send({
        shippingInfo: {
          fullName: "Phase Three Test",
          address: "1 Integration Street",
          city: "Delhi",
          state: "Delhi",
          country: "India",
          pinCode: "110001",
          phoneNo: "9999999999",
        },
        orderItems: [{ product: product._id, quantity: 1 }],
        paymentMethod: "COD",
      });
    assert.equal(replay.status, 200, replay.text);
    assert.equal(replay.body.idempotentReplay, true);
    assert.equal(String(replay.body.order._id), String(orderResponse.body.order._id));

    const afterReplay = await Product.findById(product._id);
    assert.equal(afterReplay.stock, 2, "idempotent replay must not reserve inventory twice");
  } finally {
    if (product?._id) {
      await InventoryLog.deleteMany({ product: product._id }).catch(() => {});
      await Order.deleteMany({ "orderItems.product": product._id }).catch(() => {});
      await Product.deleteOne({ _id: product._id }).catch(() => {});
    }
    if (user?._id) {
      await Cart.deleteMany({ user: user._id }).catch(() => {});
      await User.deleteOne({ _id: user._id }).catch(() => {});
    }
    await disconnectMongoDatabase().catch(() => {});
  }
});
