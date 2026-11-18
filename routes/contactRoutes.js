import express from "express";
import {
  submitContactMessage,
  getAllContacts,
  updateContactStatus,
  deleteContact,
} from "../controllers/contactController.js";

const router = express.Router();

// Public route for customer submissions
router.post("/", submitContactMessage);

// Admin routes for managing inquiries
router.get("/admin/all", getAllContacts);
router.put("/admin/:id/status", updateContactStatus);
router.delete("/admin/:id", deleteContact);

export default router;
