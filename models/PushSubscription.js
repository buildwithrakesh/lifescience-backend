import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: String,
      default: "anonymous",
    },
    role: {
      type: String,
      enum: ["visitor", "admin"],
      default: "visitor",
    },
    userAgent: {
      type: String,
      default: "",
    },
    platform: {
      type: String,
      default: "web",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const PushSubscription = mongoose.model("PushSubscription", pushSubscriptionSchema);
export default PushSubscription;
