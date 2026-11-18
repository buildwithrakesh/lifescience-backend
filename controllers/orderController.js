import Order from "../models/Order.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { cache, CACHE_KEYS } from "../config/cache.js";

// @desc    Create new order
// @route   POST /api/orders
// @access  Public or Private
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount, shippingFee, notes } = req.body;

    if (!items || items.length === 0) {
      return sendError(res, "Order must contain at least one item", 400);
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      return sendError(res, "Complete shipping address is required", 400);
    }

    // Auto-generate LSP order ID
    const orderId = "LSP" + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);

    const order = await Order.create({
      orderId,
      user: req.user ? req.user._id : undefined,
      items,
      shippingAddress,
      paymentMethod: paymentMethod || "upi",
      totalAmount: totalAmount || items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 1), 0),
      shippingFee: shippingFee || 0,
      notes: notes || "",
      status: "confirmed",
    });

    cache.del(CACHE_KEYS.ADMIN_STATS);

    return sendSuccess(res, order, "Order placed successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create order", 500, error);
  }
};

// @desc    Get user's own orders
// @route   GET /api/orders/my
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, orders, "Orders loaded");
  } catch (error) {
    return sendError(res, "Failed to get orders", 500, error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:orderId
// @access  Public / Private
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId }).lean();
    if (!order) {
      return sendError(res, "Order not found", 404);
    }
    return sendSuccess(res, order, "Order details");
  } catch (error) {
    return sendError(res, "Failed to get order", 500, error);
  }
};
