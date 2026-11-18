import FeaturedPoster from "../models/FeaturedPoster.js";
import Product from "../models/Product.js";
import { cache, CACHE_KEYS } from "../config/cache.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// Helper to look up latest product info for a target
async function resolveProductMeta(productId) {
  if (!productId) return {};
  try {
    let p = await Product.findOne({ id: productId }).lean();
    if (!p && productId.match(/^[0-9a-fA-F]{24}$/)) {
      p = await Product.findById(productId).lean();
    }
    if (p) {
      return {
        productSlug: p.id || String(p._id),
        productName: p.name,
        productImage: p.images?.main || p.imageUrl || p.img || "",
        productPrice: p.price || 0,
        productType: p.type || "",
      };
    }
  } catch (e) {
    console.error("resolveProductMeta error:", e.message);
  }
  return {};
}

// @desc    Get active featured posters for storefront homepage
// @route   GET /api/featured-posters
// @access  Public
export const getActiveFeaturedPosters = async (req, res) => {
  try {
    const cached = cache.get(CACHE_KEYS.FEATURED_POSTERS_ACTIVE);
    if (cached) {
      return sendSuccess(res, cached, "Active featured posters (cached)", 200, 300);
    }

    const posters = await FeaturedPoster.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    cache.set(CACHE_KEYS.FEATURED_POSTERS_ACTIVE, posters, 300);
    return sendSuccess(res, posters, "Active featured posters loaded", 200, 300);
  } catch (error) {
    return sendError(res, "Failed to load featured posters", 500, error);
  }
};

// @desc    Get all featured posters (Admin)
// @route   GET /api/admin/featured-posters
// @access  Private/Admin
export const getAllFeaturedPosters = async (req, res) => {
  try {
    const posters = await FeaturedPoster.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return sendSuccess(res, posters, "All featured posters retrieved");
  } catch (error) {
    return sendError(res, "Failed to fetch featured posters", 500, error);
  }
};

// @desc    Create new featured poster
// @route   POST /api/admin/featured-posters
// @access  Private/Admin
export const createFeaturedPoster = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      imageUrl,
      productId,
      productSlug,
      productName,
      productImage,
      productPrice,
      productType,
      badgeText,
      isActive,
      sortOrder,
    } = req.body;

    if (!imageUrl) {
      return sendError(res, "Poster image URL is required", 400);
    }
    if (!productId) {
      return sendError(res, "Target product is required", 400);
    }

    // Resolve product metadata if missing
    let meta = {
      productSlug: productSlug || productId,
      productName: productName || "",
      productImage: productImage || "",
      productPrice: productPrice || 0,
      productType: productType || "",
    };

    if (!meta.productName) {
      const resolved = await resolveProductMeta(productId);
      meta = { ...meta, ...resolved };
    }

    const poster = await FeaturedPoster.create({
      title: title || meta.productName || "Featured Veterinary Care",
      subtitle: subtitle || "",
      imageUrl,
      productId,
      productSlug: meta.productSlug || productId,
      productName: meta.productName || "",
      productImage: meta.productImage || "",
      productPrice: meta.productPrice || 0,
      productType: meta.productType || "",
      badgeText: badgeText || "FEATURED",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      sortOrder: Number(sortOrder) || 0,
    });

    cache.del(CACHE_KEYS.FEATURED_POSTERS_ACTIVE);
    return sendSuccess(res, poster, "Featured poster created successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create featured poster", 500, error);
  }
};

// @desc    Update featured poster
// @route   PUT /api/admin/featured-posters/:id
// @access  Private/Admin
export const updateFeaturedPoster = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If target productId changed and meta not supplied, resolve it
    if (updateData.productId && !updateData.productName) {
      const resolved = await resolveProductMeta(updateData.productId);
      Object.assign(updateData, resolved);
    }

    const poster = await FeaturedPoster.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!poster) {
      return sendError(res, "Featured poster not found", 404);
    }

    cache.del(CACHE_KEYS.FEATURED_POSTERS_ACTIVE);
    return sendSuccess(res, poster, "Featured poster updated successfully");
  } catch (error) {
    return sendError(res, "Failed to update featured poster", 500, error);
  }
};

// @desc    Delete featured poster
// @route   DELETE /api/admin/featured-posters/:id
// @access  Private/Admin
export const deleteFeaturedPoster = async (req, res) => {
  try {
    const { id } = req.params;
    const poster = await FeaturedPoster.findByIdAndDelete(id);

    if (!poster) {
      return sendError(res, "Featured poster not found", 404);
    }

    cache.del(CACHE_KEYS.FEATURED_POSTERS_ACTIVE);
    return sendSuccess(res, null, "Featured poster deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete featured poster", 500, error);
  }
};

// @desc    Reorder featured posters
// @route   PUT /api/admin/featured-posters/reorder
// @access  Private/Admin
export const reorderFeaturedPosters = async (req, res) => {
  try {
    const { order } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(order)) {
      return sendError(res, "Order array is required", 400);
    }

    const bulkOps = order.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { sortOrder: Number(item.sortOrder) || 0 } },
      },
    }));

    await FeaturedPoster.bulkWrite(bulkOps);
    cache.del(CACHE_KEYS.FEATURED_POSTERS_ACTIVE);

    return sendSuccess(res, null, "Featured posters reordered successfully");
  } catch (error) {
    return sendError(res, "Failed to reorder featured posters", 500, error);
  }
};
