import Slider from "../models/Slider.js";
import { cache, CACHE_KEYS } from "../config/cache.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// @desc    Get active sliders for homepage (Blazing fast: in-memory cache + HTTP cache)
// @route   GET /api/sliders
// @access  Public
export const getActiveSliders = async (req, res) => {
  try {
    // 1. Try In-Memory Cache first (sub-millisecond response)
    const cached = cache.get(CACHE_KEYS.SLIDERS_ACTIVE);
    if (cached) {
      return sendSuccess(res, cached, "Active sliders (cached)", 200, 300);
    }

    // 2. Query DB with lean() for maximum performance
    const sliders = await Slider.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    // 3. Store in cache for 10 minutes (600 seconds)
    cache.set(CACHE_KEYS.SLIDERS_ACTIVE, sliders, 600);

    return sendSuccess(res, sliders, "Active sliders loaded", 200, 300);
  } catch (error) {
    return sendError(res, "Failed to load sliders", 500, error);
  }
};

// @desc    Get all sliders (Admin)
// @route   GET /api/admin/sliders
// @access  Private/Admin
export const getAllSliders = async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    return sendSuccess(res, sliders, "All sliders retrieved");
  } catch (error) {
    return sendError(res, "Failed to fetch sliders", 500, error);
  }
};

// @desc    Create new slider
// @route   POST /api/admin/sliders
// @access  Private/Admin
export const createSlider = async (req, res) => {
  try {
    const { title, subtitle, imageUrl, link, badgeText, buttonText, isActive, sortOrder } = req.body;

    if (!imageUrl) {
      return sendError(res, "Image URL is required", 400);
    }

    const slider = await Slider.create({
      title: title || "Life Science Pharmaceutical",
      subtitle: subtitle || "Advanced Veterinary Care & Clinical Nutrition",
      imageUrl,
      link: link || "/products",
      badgeText: badgeText || "Clinical Nutrition",
      buttonText: buttonText || "Explore Formulations",
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
    });

    // Invalidate cache immediately so frontend sees updates instantly
    cache.del(CACHE_KEYS.SLIDERS_ACTIVE);
    cache.del(CACHE_KEYS.SLIDERS_ALL);

    return sendSuccess(res, slider, "Slider created successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create slider", 500, error);
  }
};

// @desc    Update slider
// @route   PUT /api/admin/sliders/:id
// @access  Private/Admin
export const updateSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const slider = await Slider.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!slider) {
      return sendError(res, "Slider not found", 404);
    }

    // Invalidate cache
    cache.del(CACHE_KEYS.SLIDERS_ACTIVE);
    cache.del(CACHE_KEYS.SLIDERS_ALL);

    return sendSuccess(res, slider, "Slider updated successfully");
  } catch (error) {
    return sendError(res, "Failed to update slider", 500, error);
  }
};

// @desc    Delete slider
// @route   DELETE /api/admin/sliders/:id
// @access  Private/Admin
export const deleteSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const slider = await Slider.findByIdAndDelete(id);

    if (!slider) {
      return sendError(res, "Slider not found", 404);
    }

    // Invalidate cache
    cache.del(CACHE_KEYS.SLIDERS_ACTIVE);
    cache.del(CACHE_KEYS.SLIDERS_ALL);

    return sendSuccess(res, null, "Slider deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete slider", 500, error);
  }
};

// @desc    Reorder sliders
// @route   PUT /api/admin/sliders/reorder
// @access  Private/Admin
export const reorderSliders = async (req, res) => {
  try {
    const { orders } = req.body; // array of { id, sortOrder }
    if (!Array.isArray(orders)) {
      return sendError(res, "Orders must be an array", 400);
    }

    const updates = orders.map(({ id, sortOrder }) =>
      Slider.findByIdAndUpdate(id, { sortOrder })
    );
    await Promise.all(updates);

    cache.del(CACHE_KEYS.SLIDERS_ACTIVE);
    cache.del(CACHE_KEYS.SLIDERS_ALL);

    return sendSuccess(res, null, "Sliders reordered successfully");
  } catch (error) {
    return sendError(res, "Failed to reorder sliders", 500, error);
  }
};
