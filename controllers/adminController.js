import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Slider from "../models/Slider.js";
import Contact from "../models/Contact.js";
import { cache, CACHE_KEYS } from "../config/cache.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const cached = cache.get(CACHE_KEYS.ADMIN_STATS);
    if (cached) {
      return sendSuccess(res, cached, "Dashboard stats (cached)");
    }

    const [
      totalProducts,
      activeProducts,
      totalOrders,
      totalUsers,
      totalSliders,
      recentOrders,
      ordersAggregate,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Slider.countDocuments({ isActive: true }),
      Order.find().sort({ createdAt: -1 }).limit(6).lean(),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const totalRevenue = ordersAggregate.length > 0 ? ordersAggregate[0].totalRevenue : 0;

    const stats = {
      totalProducts,
      activeProducts,
      totalOrders,
      totalUsers,
      totalSliders,
      totalRevenue,
      recentOrders,
    };

    cache.set(CACHE_KEYS.ADMIN_STATS, stats, 60);

    return sendSuccess(res, stats, "Dashboard stats retrieved");
  } catch (error) {
    return sendError(res, "Failed to fetch dashboard stats", 500, error);
  }
};

// @desc    Get all orders (with filters)
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name email phone")
        .lean(),
      Order.countDocuments(filter),
    ]);

    return sendSuccess(res, { orders, total, page: Number(page) }, "Orders loaded");
  } catch (error) {
    return sendError(res, "Failed to fetch orders", 500, error);
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (trackingNumber !== undefined) updateFields.trackingNumber = trackingNumber;

    const order = await Order.findByIdAndUpdate(id, updateFields, { new: true });
    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    cache.del(CACHE_KEYS.ADMIN_STATS);
    return sendSuccess(res, order, "Order status updated successfully");
  } catch (error) {
    return sendError(res, "Failed to update order", 500, error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    return sendSuccess(res, users, "Users loaded");
  } catch (error) {
    return sendError(res, "Failed to fetch users", 500, error);
  }
};

// @desc    Get all contact messages
// @route   GET /api/admin/contacts
// @access  Private/Admin
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, contacts, "Contacts loaded");
  } catch (error) {
    return sendError(res, "Failed to fetch contacts", 500, error);
  }
};
