import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    items: [
      {
        productId: String,
        name: String,
        price: Number,
        qty: { type: Number, default: 1 },
        packSize: String,
        imageUrl: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "confirmed",
      index: true,
    },
    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pinCode: String,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "upi", "card", "netbanking"],
      default: "upi",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    trackingNumber: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);
export default Order;
