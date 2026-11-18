import express from "express";
import {
  getActiveFeaturedPosters,
  getAllFeaturedPosters,
  createFeaturedPoster,
  updateFeaturedPoster,
  deleteFeaturedPoster,
  reorderFeaturedPosters,
} from "../controllers/featuredPosterController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Public route: active featured posters
router.get("/", getActiveFeaturedPosters);

// Admin routes (can also be mounted directly or via /api/admin)
router.get("/admin", protect, adminOnly, getAllFeaturedPosters);
router.post("/admin", protect, adminOnly, createFeaturedPoster);
router.put("/admin/reorder", protect, adminOnly, reorderFeaturedPosters);
router.put("/admin/:id", protect, adminOnly, updateFeaturedPoster);
router.delete("/admin/:id", protect, adminOnly, deleteFeaturedPoster);

export default router;
