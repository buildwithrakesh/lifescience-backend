import mongoose from "mongoose";

const sliderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "Life Science Pharmaceutical",
    },
    subtitle: {
      type: String,
      trim: true,
      default: "Advanced Veterinary Care & Clinical Nutrition",
    },
    imageUrl: {
      type: String,
      required: [true, "Slider image URL is required"],
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: "/products",
    },
    badgeText: {
      type: String,
      trim: true,
      default: "Clinical Nutrition",
    },
    buttonText: {
      type: String,
      trim: true,
      default: "Explore Formulations",
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

// Compound index for super fast active slider queries sorted by sortOrder
sliderSchema.index({ isActive: 1, sortOrder: 1 });

export const Slider = mongoose.model("Slider", sliderSchema);
export default Slider;
