import mongoose from "mongoose";

const featuredPosterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      required: [true, "Poster image URL is required"],
      trim: true,
    },
    // Target Product Details
    productId: {
      type: String,
      required: [true, "Target product is required"],
      trim: true,
      index: true,
    },
    productSlug: {
      type: String,
      trim: true,
      default: "",
    },
    productName: {
      type: String,
      trim: true,
      default: "",
    },
    productImage: {
      type: String,
      trim: true,
      default: "",
    },
    productPrice: {
      type: Number,
      default: 0,
    },
    productType: {
      type: String,
      trim: true,
      default: "",
    },
    badgeText: {
      type: String,
      trim: true,
      default: "FEATURED",
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

featuredPosterSchema.index({ isActive: 1, sortOrder: 1 });

export const FeaturedPoster = mongoose.model("FeaturedPoster", featuredPosterSchema);
export default FeaturedPoster;
