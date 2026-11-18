import express from "express";
import { createOrder, getMyOrders, getOrderById } from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/my", protect, getMyOrders);
router.get("/:orderId", getOrderById);

export default router;
