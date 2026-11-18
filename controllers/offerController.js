import Offer from "../models/Offer.js";
import Product from "../models/Product.js";
import { cache, CACHE_KEYS } from "../config/cache.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// Helper to resolve product snapshots from an array of product IDs/slugs
async function resolveProductsMeta(productIds = [], providedTargetProducts = []) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return { productIds: [], targetProducts: [] };
  }

  const cleanIds = [...new Set(productIds.map((x) => String(x || "").trim()).filter(Boolean))];
  const providedMap = new Map();
  if (Array.isArray(providedTargetProducts)) {
    providedTargetProducts.forEach((tp) => {
      if (tp?.id) providedMap.set(String(tp.id), tp);
      if (tp?.slug) providedMap.set(String(tp.slug), tp);
    });
  }

  const resolvedTargets = [];
  const allMatchedIds = new Set(cleanIds);

  for (const pid of cleanIds) {
    let found = null;
    try {
      found = await Product.findOne({ id: pid }).lean();
      if (!found && pid.match(/^[0-9a-fA-F]{24}$/)) {
        found = await Product.findById(pid).lean();
      }
    } catch {}

    if (found) {
      const slug = found.id || String(found._id);
      allMatchedIds.add(slug);
      allMatchedIds.add(String(found._id));
      resolvedTargets.push({
        id: String(found._id),
        slug,
        name: found.name || "",
        image: found.images?.main || found.imageUrl || found.img || "",
        price: Number(found.price) || 0,
      });
    } else if (providedMap.has(pid)) {
      const tp = providedMap.get(pid);
      resolvedTargets.push({
        id: String(tp.id || pid),
        slug: String(tp.slug || tp.id || pid),
        name: tp.name || pid,
        image: tp.image || "",
        price: Number(tp.price) || 0,
      });
    } else {
      resolvedTargets.push({
        id: pid,
        slug: pid,
        name: pid,
        image: "",
        price: 0,
      });
    }
  }

  return {
    productIds: [...allMatchedIds],
    targetProducts: resolvedTargets,
  };
}

// @desc    Get active offers for storefront (Home, Products, Cart, Checkout)
// @route   GET /api/offers
// @access  Public
export const getActiveOffers = async (req, res) => {
  try {
    const cached = cache.get(CACHE_KEYS.OFFERS_ACTIVE);
    if (cached) {
      return sendSuccess(res, cached, "Active offers (cached)", 200, 300);
    }

    const offers = await Offer.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    cache.set(CACHE_KEYS.OFFERS_ACTIVE, offers, 300);
    return sendSuccess(res, offers, "Active offers loaded", 200, 300);
  } catch (error) {
    return sendError(res, "Failed to load offers", 500, error);
  }
};

// @desc    Get all offers (Admin)
// @route   GET /api/admin/offers
// @access  Private/Admin
export const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return sendSuccess(res, offers, "All offers retrieved");
  } catch (error) {
    return sendError(res, "Failed to fetch offers", 500, error);
  }
};

// @desc    Create new offer
// @route   POST /api/admin/offers
// @access  Private/Admin
export const createOffer = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      imageUrl,
      discountPercent,
      scope,
      productIds,
      targetProducts,
      isActive,
      sortOrder,
    } = req.body;

    if (!title || !String(title).trim()) {
      return sendError(res, "Offer title is required", 400);
    }
    if (!imageUrl || !String(imageUrl).trim()) {
      return sendError(res, "Offer banner image URL is required", 400);
    }

    const pct = Number(discountPercent);
    if (Number.isNaN(pct) || pct < 1 || pct > 95) {
      return sendError(res, "Discount percentage must be between 1 and 95", 400);
    }

    const normalizedScope = scope === "specific" ? "specific" : "all";
    let resolved = { productIds: [], targetProducts: [] };

    if (normalizedScope === "specific") {
      const incomingIds = Array.isArray(productIds) && productIds.length > 0
        ? productIds
        : Array.isArray(targetProducts)
          ? targetProducts.map((tp) => tp.slug || tp.id).filter(Boolean)
          : [];

      if (incomingIds.length === 0) {
        return sendError(res, "Please select at least one product for a specific-product offer", 400);
      }

      resolved = await resolveProductsMeta(incomingIds, targetProducts);
    }

    const offer = await Offer.create({
      title: String(title).trim(),
      subtitle: subtitle ? String(subtitle).trim() : "",
      imageUrl: String(imageUrl).trim(),
      discountPercent: pct,
      scope: normalizedScope,
      productIds: resolved.productIds,
      targetProducts: resolved.targetProducts,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      sortOrder: Number(sortOrder) || 0,
    });

    cache.del(CACHE_KEYS.OFFERS_ACTIVE);
    return sendSuccess(res, offer, "Offer created successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create offer", 500, error);
  }
};

// @desc    Update offer
// @route   PUT /api/admin/offers/:id
// @access  Private/Admin
export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.discountPercent !== undefined) {
      const pct = Number(updateData.discountPercent);
      if (Number.isNaN(pct) || pct < 1 || pct > 95) {
        return sendError(res, "Discount percentage must be between 1 and 95", 400);
      }
      updateData.discountPercent = pct;
    }

    if (updateData.scope === "all") {
      updateData.productIds = [];
      updateData.targetProducts = [];
    } else if (updateData.scope === "specific") {
      const incomingIds =
        Array.isArray(updateData.productIds) && updateData.productIds.length > 0
          ? updateData.productIds
          : Array.isArray(updateData.targetProducts)
            ? updateData.targetProducts.map((tp) => tp.slug || tp.id).filter(Boolean)
            : [];

      if (incomingIds.length === 0) {
        return sendError(res, "Please select at least one product for a specific-product offer", 400);
      }

      const resolved = await resolveProductsMeta(incomingIds, updateData.targetProducts);
      updateData.productIds = resolved.productIds;
      updateData.targetProducts = resolved.targetProducts;
    }

    const offer = await Offer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!offer) {
      return sendError(res, "Offer not found", 404);
    }

    cache.del(CACHE_KEYS.OFFERS_ACTIVE);
    return sendSuccess(res, offer, "Offer updated successfully");
  } catch (error) {
    return sendError(res, "Failed to update offer", 500, error);
  }
};

// @desc    Delete offer
// @route   DELETE /api/admin/offers/:id
// @access  Private/Admin
export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndDelete(id);

    if (!offer) {
      return sendError(res, "Offer not found", 404);
    }

    cache.del(CACHE_KEYS.OFFERS_ACTIVE);
    return sendSuccess(res, { id }, "Offer deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete offer", 500, error);
  }
};

// @desc    Reorder offers
// @route   PUT /api/admin/offers/reorder
// @access  Private/Admin
export const reorderOffers = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return sendError(res, "Invalid reorder payload", 400);
    }

    const bulkOps = items.map((item, idx) => ({
      updateOne: {
        filter: { _id: item.id || item._id },
        update: { $set: { sortOrder: item.sortOrder ?? idx } },
      },
    }));

    if (bulkOps.length > 0) {
      await Offer.bulkWrite(bulkOps);
    }

    cache.del(CACHE_KEYS.OFFERS_ACTIVE);
    return sendSuccess(res, null, "Offers reordered successfully");
  } catch (error) {
    return sendError(res, "Failed to reorder offers", 500, error);
  }
};
