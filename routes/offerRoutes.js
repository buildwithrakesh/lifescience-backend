import express from "express";
import {
  getActiveOffers,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  reorderOffers,
} from "../controllers/offerController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Public route: active offers
router.get("/", getActiveOffers);

// Admin routes
router.get("/admin", protect, adminOnly, getAllOffers);
router.post("/admin", protect, adminOnly, createOffer);
router.put("/admin/reorder", protect, adminOnly, reorderOffers);
router.put("/admin/:id", protect, adminOnly, updateOffer);
router.delete("/admin/:id", protect, adminOnly, deleteOffer);

export default router;
