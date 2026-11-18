import Contact from "../models/Contact.js";

const DEFAULT_SAMPLE_CONTACTS = [
  {
    name: "Surinder Singh (Dairy Farm)",
    email: "surinder.karnal@example.com",
    phone: "+91 98123 45678",
    subject: "Bulk Order & Farm Dispatch",
    message: "We operate a 45-cow dairy farm in Karnal. Looking for bulk supply of Life Science Calci-Gel and Milk Booster. Please share distributor pricing and delivery schedule.",
    status: "unread",
  },
  {
    name: "Dr. Meenakshi Iyer (Vet Clinic)",
    email: "dr.meenakshi@example.com",
    phone: "+91 97654 32109",
    subject: "Product Inquiry & Dealership",
    message: "I prescribe VetCare herbal liver and respiratory formulations at our veterinary clinic. Would like to enquire about authorized dealership in Pune region.",
    status: "read",
  },
  {
    name: "Rajesh Solanki",
    email: "rajesh.solanki@example.com",
    phone: "+91 94231 87654",
    subject: "Dosage & Health Consultation",
    message: "One of our Jersey cows has sluggish digestion post-calving. Can I administer Liv-Pro Herbal along with Calcium Gel? Please suggest recommended ml per day.",
    status: "responded",
  },
];

// @desc    Submit a contact inquiry from storefront
// @route   POST /api/contacts
// @access  Public
export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !name.trim() || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide your name and inquiry message.",
      });
    }

    const newContact = await Contact.create({
      name: name.trim(),
      email: email ? email.trim() : "",
      phone: phone ? phone.trim() : "",
      subject: subject ? subject.trim() : "General Inquiry",
      message: message.trim(),
      status: "unread",
    });

    res.status(201).json({
      success: true,
      message: "Thank you! Your message has been sent to our veterinary team.",
      data: newContact,
    });
  } catch (error) {
    console.error("Error submitting contact inquiry:", error);
    res.status(500).json({ success: false, message: "Failed to submit inquiry", error: error.message });
  }
};

// @desc    Get all contact messages for Admin Panel
// @route   GET /api/contacts/admin/all
// @access  Admin
export const getAllContacts = async (req, res) => {
  try {
    const { status } = req.query;

    // Seed defaults if empty
    const totalCount = await Contact.countDocuments();
    if (totalCount === 0) {
      await Contact.insertMany(DEFAULT_SAMPLE_CONTACTS);
    }

    const filter = {};
    if (status && ["unread", "read", "responded"].includes(status)) {
      filter.status = status;
    }

    const contacts = await Contact.find(filter).sort({ createdAt: -1 });

    const total = await Contact.countDocuments();
    const unread = await Contact.countDocuments({ status: "unread" });
    const read = await Contact.countDocuments({ status: "read" });
    const responded = await Contact.countDocuments({ status: "responded" });

    res.status(200).json({
      success: true,
      counts: {
        total,
        unread,
        read,
        responded,
      },
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching admin contacts:", error);
    res.status(500).json({ success: false, message: "Failed to load messages", error: error.message });
  }
};

// @desc    Update contact message status
// @route   PUT /api/contacts/admin/:id/status
// @access  Admin
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["unread", "read", "responded"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    contact.status = status;
    await contact.save();

    res.status(200).json({
      success: true,
      message: `Message status updated to ${status}`,
      data: contact,
    });
  } catch (error) {
    console.error("Error updating contact status:", error);
    res.status(500).json({ success: false, message: "Failed to update status", error: error.message });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contacts/admin/:id
// @access  Admin
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ success: false, message: "Failed to delete message", error: error.message });
  }
};
