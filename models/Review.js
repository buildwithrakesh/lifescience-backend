import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Reviewer name is required"],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: "India",
    },
    product: {
      type: String,
      trim: true,
      default: "Life Science Veterinary Product",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    title: {
      type: String,
      trim: true,
      default: "Verified Customer Review",
    },
    comment: {
      type: String,
      required: [true, "Review comment/feedback is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    helpful: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    ret.verified = ret.isVerified || ret.status === "approved";
    ret.date = ret.createdAt
      ? new Date(ret.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
      : "Recently";
    return ret;
  },
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;
