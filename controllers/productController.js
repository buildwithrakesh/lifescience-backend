import Product from "../models/Product.js";
import { cache, CACHE_KEYS } from "../config/cache.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// @desc    Get all products with optional filters (supports public & admin modes)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      animal,
      formulation,
      search,
      sort = "popular",
      limit = 100,
      includeDrafts,
      status,
    } = req.query;

    const parsedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    const isAdminView = includeDrafts === "true" || status === "all" || status === "draft";
    const isDefaultQuery =
      !category && !animal && !formulation && !search && sort === "popular" && !isAdminView;

    // Use fast in-memory cache for default public query (always cache full list, slice to limit)
    if (isDefaultQuery) {
      const cached = cache.get(CACHE_KEYS.PRODUCTS_ALL);
      if (cached) {
        return sendSuccess(res, cached.slice(0, parsedLimit), "Products (cached)", 200, 300);
      }
    }

    // Build filter
    const filter = {};

    if (isAdminView) {
      if (status && status !== "all") {
        filter.status = status;
      }
    } else {
      filter.isActive = { $ne: false };
      filter.status = { $ne: "draft" };
    }

    if (category && category !== "all") {
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (animal && animal !== "all") {
      filter.$or = [
        { targetAnimals: { $in: [new RegExp(animal, "i")] } },
        { suitableFor: { $in: [new RegExp(animal, "i")] } },
      ];
    }

    if (formulation && formulation !== "all") {
      filter.$or = [
        { formulation: { $regex: new RegExp(formulation, "i") } },
        { productForm: { $regex: new RegExp(formulation, "i") } },
      ];
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      filter.$or = [
        { name: searchRegex },
        { tagline: searchRegex },
        { type: searchRegex },
        { description: searchRegex },
        { tag: searchRegex },
        { category: searchRegex },
      ];
    }

    // Build sort: prioritize sortOrder so products maintain their standard order
    let sortObj = { sortOrder: 1, displayOrder: 1, createdAt: -1 };
    if (sort === "price-asc") sortObj = { price: 1 };
    if (sort === "price-desc") sortObj = { price: -1 };
    if (sort === "rating") sortObj = { rating: -1 };
    if (sort === "name") sortObj = { name: 1 };
    if (sort === "newest") sortObj = { createdAt: -1 };

    if (isDefaultQuery) {
      const allProducts = await Product.find(filter)
        .sort(sortObj)
        .lean();

      cache.set(CACHE_KEYS.PRODUCTS_ALL, allProducts, 300);
      const sliced = allProducts.slice(0, parsedLimit);
      return sendSuccess(res, sliced, `Loaded ${sliced.length} products`, 200, 300);
    }

    const products = await Product.find(filter)
      .sort(sortObj)
      .limit(parsedLimit)
      .lean();

    return sendSuccess(res, products, `Loaded ${products.length} products`, 200, 180);
  } catch (error) {
    return sendError(res, "Failed to load products", 500, error);
  }
};

// @desc    Get single product by slug ID or Mongo ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `product:${id}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return sendSuccess(res, cached, "Product details (cached)", 200, 300);
    }

    // Fast secondary lookup from cached full catalog (avoids MongoDB round-trip after Home/Products load)
    const cachedAll = cache.get(CACHE_KEYS.PRODUCTS_ALL);
    if (Array.isArray(cachedAll) && cachedAll.length > 0) {
      const hit = cachedAll.find(
        (p) => p.id === id || String(p._id) === id
      );
      if (hit) {
        cache.set(cacheKey, hit, 600);
        return sendSuccess(res, hit, "Product details (cached)", 200, 300);
      }
    }

    let product = await Product.findOne({ id }).lean();
    if (!product && id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).lean();
    }

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    cache.set(cacheKey, product, 600);
    return sendSuccess(res, product, "Product retrieved", 200, 300);
  } catch (error) {
    return sendError(res, "Failed to get product", 500, error);
  }
};

// Helper to generate a clean, safe slug ID
const generateSlug = (name) => {
  return (name || "product")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Helper to synchronize packSizes (with pack-specific images & optional prices) and packing labels
const normalizePackSizes = (payload) => {
  if (Array.isArray(payload.packSizes) && payload.packSizes.length > 0) {
    const cleaned = payload.packSizes
      .filter((p) => p && p.size && String(p.size).trim())
      .map((p, idx) => {
        const parsedPrice = Number(p.price);
        const parsedMult = Number(p.priceMultiplier);
        return {
          size: String(p.size).trim(),
          priceMultiplier:
            !Number.isNaN(parsedMult) && parsedMult > 0
              ? parsedMult
              : idx === 0
              ? 1
              : Number((1 + idx * 0.4).toFixed(2)),
          ...(!Number.isNaN(parsedPrice) && parsedPrice > 0 ? { price: parsedPrice } : {}),
          image: p.image ? String(p.image).trim() : "",
        };
      });
    payload.packSizes = cleaned;
    payload.packing = cleaned.map((p) => p.size);
  } else if (Array.isArray(payload.packing) && payload.packing.length > 0) {
    const cleanLabels = payload.packing.map((s) => String(s || "").trim()).filter(Boolean);
    payload.packing = cleanLabels;
    if (payload.packSizes !== undefined) {
      payload.packSizes = cleanLabels.map((size, idx) => ({
        size,
        priceMultiplier: idx === 0 ? 1 : Number((1 + idx * 0.4).toFixed(2)),
        image: "",
      }));
    }
  }
};

// @desc    Create product (Admin)
// @route   POST /api/admin/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Auto-generate unique slug ID if missing
    if (!productData.id) {
      const baseSlug = generateSlug(productData.name);
      let candidateSlug = baseSlug;
      let counter = 1;
      while (await Product.findOne({ id: candidateSlug })) {
        candidateSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      productData.id = candidateSlug;
    } else {
      const existing = await Product.findOne({ id: productData.id });
      if (existing) {
        return sendError(res, "A product with this unique ID already exists", 400);
      }
    }

    // Sync image fields
    if (productData.images?.main && !productData.imageUrl) {
      productData.imageUrl = productData.images.main;
    } else if (productData.imageUrl && (!productData.images || !productData.images.main)) {
      productData.images = { ...(productData.images || {}), main: productData.imageUrl };
    }

    // Ensure tag chip is cleared
    productData.tag = "";

    // Sync status & active
    if (productData.status === "draft") {
      productData.isActive = false;
    } else {
      productData.status = "published";
      productData.isActive = true;
    }

    // Sync legacy fields
    if (productData.featuresAndBenefits?.length && !productData.benefits?.length) {
      productData.benefits = productData.featuresAndBenefits;
    }
    if (productData.suitableFor?.length && !productData.targetAnimals?.length) {
      productData.targetAnimals = productData.suitableFor;
    }
    if (productData.productForm) {
      productData.formulation = productData.productForm.toLowerCase();
    }
    if (productData.displayOrder !== undefined) {
      productData.sortOrder = Number(productData.displayOrder) || 1;
    } else if (productData.sortOrder !== undefined) {
      productData.displayOrder = Number(productData.sortOrder) || 1;
    }

    normalizePackSizes(productData);

    const product = await Product.create(productData);

    cache.del(CACHE_KEYS.PRODUCTS_ALL);
    cache.delByPrefix("product:");

    return sendSuccess(res, product, "Product created successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create product: " + error.message, 500, error);
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Sync image fields
    if (updateData.images?.main) {
      updateData.imageUrl = updateData.images.main;
    } else if (updateData.imageUrl) {
      updateData.images = { ...(updateData.images || {}), main: updateData.imageUrl };
    }

    // Ensure tag chip is cleared
    updateData.tag = "";

    // Sync status & active
    if (updateData.status) {
      updateData.isActive = updateData.status === "published";
    } else if (updateData.isActive !== undefined) {
      updateData.status = updateData.isActive ? "published" : "draft";
    }

    // Sync legacy fields
    if (updateData.featuresAndBenefits?.length) {
      updateData.benefits = updateData.featuresAndBenefits;
    }
    if (updateData.suitableFor?.length) {
      updateData.targetAnimals = updateData.suitableFor;
    }
    if (updateData.productForm) {
      updateData.formulation = updateData.productForm.toLowerCase();
    }
    if (updateData.displayOrder !== undefined) {
      updateData.sortOrder = Number(updateData.displayOrder) || 1;
    } else if (updateData.sortOrder !== undefined) {
      updateData.displayOrder = Number(updateData.sortOrder) || 1;
    }

    normalizePackSizes(updateData);

    const query = {
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }].filter(Boolean),
    };

    const product = await Product.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    cache.del(CACHE_KEYS.PRODUCTS_ALL);
    cache.del(`product:${id}`);
    cache.del(`product:${product.id}`);

    return sendSuccess(res, product, "Product updated successfully");
  } catch (error) {
    return sendError(res, "Failed to update product: " + error.message, 500, error);
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const query = {
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }].filter(Boolean),
    };

    const product = await Product.findOneAndDelete(query);

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    cache.del(CACHE_KEYS.PRODUCTS_ALL);
    cache.del(`product:${id}`);
    cache.del(`product:${product.id}`);

    return sendSuccess(res, null, "Product deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete product", 500, error);
  }
};
