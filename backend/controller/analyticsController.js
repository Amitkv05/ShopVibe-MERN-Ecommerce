import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";

export const dashboardAnalytics = handleAsyncError(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400000);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new HandleError("Analytics from/to must be valid dates", 400);
  }
  if (from > to) throw new HandleError("Analytics from date must be before to date", 400);
  const dateMatch = { createdAt: { $gte: from, $lte: to } };

  const [orderStats, dailyRevenue, topProducts, users, products, lowStock] = await Promise.all([
    Order.aggregate([
      { $match: dateMatch },
      { $group: { _id: "$orderStatus", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $ne: ["$orderStatus", "Cancelled"] }, "$totalPrice", 0] } } } },
    ]),
    Order.aggregate([
      { $match: { ...dateMatch, orderStatus: { $ne: "Cancelled" } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { ...dateMatch, orderStatus: { $ne: "Cancelled" } } },
      { $unwind: "$orderItems" },
      { $group: { _id: "$orderItems.product", name: { $first: "$orderItems.name" }, quantity: { $sum: "$orderItems.quantity" }, revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } } } },
      { $sort: { quantity: -1 } }, { $limit: 10 },
    ]),
    User.countDocuments(),
    Product.countDocuments({ active: { $ne: false } }),
    Product.aggregate([{ $match: { active: { $ne: false } } }, { $match: { $expr: { $lte: ["$stock", "$lowStockThreshold"] } } }, { $count: "count" }]),
  ]);

  const totalRevenue = orderStats.reduce((s, x) => s + x.revenue, 0);
  const totalOrders = orderStats.reduce((s, x) => s + x.count, 0);
  res.json({ success: true, range: { from, to }, summary: { totalRevenue, totalOrders, users, products, lowStockProducts: lowStock[0]?.count || 0 }, orderStats, dailyRevenue, topProducts });
});
