import express from "express";
import {
  getApprovedReviews,
  createReview,
  getAllReviewsAdmin,
  updateReviewStatus,
  deleteReview,
  markReviewHelpful,
} from "../controllers/reviewController.js";

const router = express.Router();

// Public routes
router.get("/", getApprovedReviews);
router.post("/", createReview);
router.patch("/:id/helpful", markReviewHelpful);

// Admin routes
router.get("/admin/all", getAllReviewsAdmin);
router.put("/admin/:id/status", updateReviewStatus);
router.delete("/admin/:id", deleteReview);

export default router;
