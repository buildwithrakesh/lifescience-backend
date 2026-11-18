import mongoose from "mongoose";

const targetProductSubSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true, default: "" },
    slug: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Offer title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      required: [true, "Offer banner image URL is required"],
      trim: true,
    },
    discountPercent: {
      type: Number,
      required: [true, "Discount percentage is required"],
      min: [1, "Discount must be at least 1%"],
      max: [95, "Discount cannot exceed 95%"],
    },
    // "all" = All Products, "specific" = Selected specific product(s)
    scope: {
      type: String,
      enum: ["all", "specific"],
      default: "all",
      index: true,
    },
    // Flat array of product IDs/slugs for fast matching
    productIds: {
      type: [String],
      default: [],
    },
    // Snapshot of selected products for display without extra DB lookups
    targetProducts: {
      type: [targetProductSubSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

offerSchema.index({ isActive: 1, sortOrder: 1 });

export const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
