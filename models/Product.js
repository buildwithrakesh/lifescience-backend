import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      trim: true,
      default: "Veterinary Formulation",
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    mrp: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    tag: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    productForm: {
      type: String,
      trim: true,
      default: "Bolus",
    },
    suitableFor: {
      type: [String],
      default: ["Cow", "Buffalo"],
    },
    description: {
      type: String,
      default: "",
    },
    images: {
      main: { type: String, default: "" },
      gallery: { type: [String], default: [] },
      poster: { type: String, default: "" },
    },
    imageUrl: {
      type: String,
      default: "",
    },
    // Product Information Sections
    featuresAndBenefits: {
      type: [String],
      default: [],
    },
    advantages: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    actions: {
      type: [String],
      default: [],
    },
    indications: {
      type: [String],
      default: [],
    },
    composition: {
      type: String,
      default: "",
    },
    compositionTable: [
      {
        ingredient: { type: String, default: "" },
        quantity: { type: String, default: "" },
        unit: { type: String, default: "" },
      },
    ],
    dosage: {
      type: String,
      default: "",
    },
    dosageNotes: {
      type: String,
      default: "",
    },
    usages: {
      type: [String],
      default: [],
    },
    // Packing & Storage
    packing: {
      type: [String],
      default: [],
    },
    storage: {
      type: String,
      default: "",
    },
    // Legacy / storefront compatibility fields
    benefits: {
      type: [String],
      default: [],
    },
    precautions: {
      type: String,
      default: "",
    },
    targetAnimals: {
      type: [String],
      default: ["Cow", "Buffalo"],
      index: true,
    },
    formulation: {
      type: String,
      default: "tonic",
      index: true,
    },
    packSizes: [
      {
        size: { type: String, trim: true },
        priceMultiplier: { type: Number, default: 1 },
        price: { type: Number },
        image: { type: String, default: "" },
      },
    ],
    // Status & Visibility
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save synchronization hook for maximum backward & forward compatibility
productSchema.pre("save", function (next) {
  // Sync images
  if (this.images?.main && !this.imageUrl) {
    this.imageUrl = this.images.main;
  } else if (this.imageUrl && (!this.images || !this.images.main)) {
    if (!this.images) this.images = {};
    this.images.main = this.imageUrl;
  }


  // Sync status with isActive
  if (this.status === "draft") {
    this.isActive = false;
  } else if (this.status === "published") {
    this.isActive = true;
  }

  // Sync suitableFor with targetAnimals
  if (Array.isArray(this.suitableFor) && this.suitableFor.length > 0) {
    this.targetAnimals = this.suitableFor;
  }

  // Sync productForm with formulation
  if (this.productForm) {
    this.formulation = this.productForm.toLowerCase();
  }

  // Sync featuresAndBenefits with benefits
  if (Array.isArray(this.featuresAndBenefits) && this.featuresAndBenefits.length > 0) {
    this.benefits = this.featuresAndBenefits;
  }

  // Sync packing <-> packSizes bidirectionally while preserving pack images & pricing
  if (Array.isArray(this.packSizes) && this.packSizes.length > 0) {
    const cleanPackSizes = this.packSizes
      .filter((p) => p && p.size && String(p.size).trim())
      .map((p, idx) => ({
        size: String(p.size).trim(),
        priceMultiplier:
          typeof p.priceMultiplier === "number" && !Number.isNaN(p.priceMultiplier)
            ? p.priceMultiplier
            : idx === 0
            ? 1
            : Number((1 + idx * 0.4).toFixed(2)),
        ...(typeof p.price === "number" && !Number.isNaN(p.price) && p.price > 0
          ? { price: p.price }
          : {}),
        image: p.image ? String(p.image).trim() : "",
      }));
    this.packSizes = cleanPackSizes;
    this.packing = cleanPackSizes.map((p) => p.size);
  } else if (Array.isArray(this.packing) && this.packing.length > 0) {
    this.packSizes = this.packing
      .map((s) => String(s || "").trim())
      .filter(Boolean)
      .map((size, idx) => ({
        size,
        priceMultiplier: idx === 0 ? 1 : Number((1 + idx * 0.4).toFixed(2)),
        image: "",
      }));
  }

  // Sync displayOrder and sortOrder bidirectionally
  if (this.displayOrder !== undefined && (this.sortOrder === undefined || this.sortOrder === null)) {
    this.sortOrder = this.displayOrder;
  } else if (this.sortOrder !== undefined && (this.displayOrder === undefined || this.displayOrder === null)) {
    this.displayOrder = this.sortOrder;
  }

  next();
});

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: "text", description: "text", type: "text", tagline: "text" });

export const Product = mongoose.model("Product", productSchema);
export default Product;
