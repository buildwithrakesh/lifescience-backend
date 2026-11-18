import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sender name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      default: "Product Inquiry",
    },
    message: {
      type: String,
      required: [true, "Inquiry message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["unread", "read", "responded"],
      default: "unread",
      index: true,
    },
  },
  { timestamps: true }
);

contactSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    ret.date = ret.createdAt
      ? new Date(ret.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "Recently";
    return ret;
  },
});

export const Contact = mongoose.model("Contact", contactSchema);
export default Contact;
