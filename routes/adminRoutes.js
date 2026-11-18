import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  getContacts,
} from "../controllers/adminController.js";
import {
  getAllSliders,
  createSlider,
  updateSlider,
  deleteSlider,
  reorderSliders,
} from "../controllers/sliderController.js";
import {
  getAllFeaturedPosters,
  createFeaturedPoster,
  updateFeaturedPoster,
  deleteFeaturedPoster,
  reorderFeaturedPosters,
} from "../controllers/featuredPosterController.js";
import {
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  reorderOffers,
} from "../controllers/offerController.js";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Apply auth + admin guard to all admin routes
router.use(protect, adminOnly);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Slider Management
router.get("/sliders", getAllSliders);
router.post("/sliders", createSlider);
router.put("/sliders/reorder", reorderSliders);
router.put("/sliders/:id", updateSlider);
router.delete("/sliders/:id", deleteSlider);

// Featured Posters Management
router.get("/featured-posters", getAllFeaturedPosters);
router.post("/featured-posters", createFeaturedPoster);
router.put("/featured-posters/reorder", reorderFeaturedPosters);
router.put("/featured-posters/:id", updateFeaturedPoster);
router.delete("/featured-posters/:id", deleteFeaturedPoster);

// Offers Management
router.get("/offers", getAllOffers);
router.post("/offers", createOffer);
router.put("/offers/reorder", reorderOffers);
router.put("/offers/:id", updateOffer);
router.delete("/offers/:id", deleteOffer);

// Product Management
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Orders Management
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);

// Users Management
router.get("/users", getAllUsers);

// Contacts
router.get("/contacts", getContacts);

export default router;
