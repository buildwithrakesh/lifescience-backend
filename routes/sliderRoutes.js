import express from "express";
import { getActiveSliders } from "../controllers/sliderController.js";

const router = express.Router();

// GET /api/sliders - Public active sliders with caching
router.get("/", getActiveSliders);

export default router;
