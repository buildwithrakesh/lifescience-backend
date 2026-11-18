import express from "express";
import { getProducts, getProductById } from "../controllers/productController.js";

const router = express.Router();

// GET /api/products - Public products list with caching and filters
router.get("/", getProducts);

// GET /api/products/:id - Single product by slug ID
router.get("/:id", getProductById);

export default router;
