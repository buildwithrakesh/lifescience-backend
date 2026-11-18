import Review from "../models/Review.js";

const DEFAULT_SEED_REVIEWS = [
  {
    name: "Ramesh Kumar",
    location: "Karnal, Haryana",
    product: "Life Science Milk Booster & Calci-Gel",
    rating: 5,
    title: "Noticeable increase in milk yield",
    comment: "Saw a steady 2L/day increase per cow within 2 weeks of using Calci-Gel. Post-calving recovery was smooth and cattle energy is noticeably better.",
    status: "approved",
    isVerified: true,
    helpful: 48,
  },
  {
    name: "Dr. Aniruddh Deshmukh",
    location: "Kolhapur, Maharashtra",
    product: "Life Science Liv-Pro Herbal",
    rating: 5,
    title: "Effective for acute liver recovery",
    comment: "Consistent bioavailability and rapid clinical turnaround in livestock experiencing loss of appetite and sluggish digestion. High pharmaceutical standards.",
    status: "approved",
    isVerified: true,
    helpful: 62,
  },
  {
    name: "Sunder Singh",
    location: "Namakkal, Tamil Nadu",
    product: "Life Science Poultry Multivitamin",
    rating: 5,
    title: "Reduced summer heat stress in flock",
    comment: "Flock mortality dropped significantly during hot days. Eggshell firmness in our layer batch improved noticeably with fewer breakages.",
    status: "approved",
    isVerified: true,
    helpful: 31,
  },
  {
    name: "Priya Sharma",
    location: "Bengaluru, Karnataka",
    product: "Life Science Pet Joint Care",
    rating: 5,
    title: "Bruno's mobility is completely back!",
    comment: "My 9-year-old Labrador had severe joint stiffness and avoided stairs. After 3 weeks of Arthro-Pet syrup, he is active, walking comfortably, and happy again.",
    status: "approved",
    isVerified: true,
    helpful: 19,
  },
  {
    name: "Balwant Patel",
    location: "Anand, Gujarat",
    product: "Life Science Mineral Mixture",
    rating: 5,
    title: "High quality mineral mix for cattle & goats",
    comment: "Animals consume it without hesitation. Coat shine improved and young calves are gaining weight steadily. Prompt, secure delivery.",
    status: "approved",
    isVerified: true,
    helpful: 27,
  },
  {
    name: "Vikas Yadav",
    location: "Meerut, UP",
    product: "Life Science Ionic Calcium Gel",
    rating: 5,
    title: "Best post-calving energy gel",
    comment: "Restores ionic calcium within hours and prevents milk fever. A must-have supplement for commercial dairy herds.",
    status: "approved",
    isVerified: true,
    helpful: 35,
  },
];

// @desc    Get all APPROVED reviews for public storefront
// @route   GET /api/reviews
// @access  Public
export const getApprovedReviews = async (req, res) => {
  try {
    let reviews = await Review.find({ status: "approved" }).sort({ createdAt: -1 });

    // Seed defaults if collection is empty
    if (reviews.length === 0) {
      const count = await Review.countDocuments();
      if (count === 0) {
        await Review.insertMany(DEFAULT_SEED_REVIEWS);
        reviews = await Review.find({ status: "approved" }).sort({ createdAt: -1 });
      }
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching approved reviews:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reviews", error: error.message });
  }
};

// @desc    Submit a review from storefront (ALWAYS saved as pending)
// @route   POST /api/reviews
// @access  Public
export const createReview = async (req, res) => {
  try {
    const { name, location, product, rating, title, comment } = req.body;

    if (!name || !name.trim() || !comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reviewer name and comment are required.",
      });
    }

    const newReview = await Review.create({
      name: name.trim(),
      location: location ? location.trim() : "India",
      product: product ? product.trim() : "Life Science Veterinary Product",
      rating: Number(rating) || 5,
      title: title ? title.trim() : "Verified Customer Feedback",
      comment: comment.trim(),
      status: "pending", // Strict requirement: Must be pending until verified by admin
      isVerified: false,
      helpful: 0,
    });

    res.status(201).json({
      success: true,
      message: "Thank you! Your review has been submitted for verification and will appear after admin approval.",
      data: newReview,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ success: false, message: "Failed to submit review", error: error.message });
  }
};

// @desc    Get all reviews for Admin Panel with counts and filters
// @route   GET /api/reviews/admin/all
// @access  Admin
export const getAllReviewsAdmin = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 });

    const total = await Review.countDocuments();
    const pending = await Review.countDocuments({ status: "pending" });
    const approved = await Review.countDocuments({ status: "approved" });
    const rejected = await Review.countDocuments({ status: "rejected" });

    // Calculate average rating of approved reviews
    const avgResult = await Review.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    const avgRating = avgResult.length > 0 ? Number(avgResult[0].avgRating.toFixed(1)) : 5.0;

    res.status(200).json({
      success: true,
      counts: {
        total,
        pending,
        approved,
        rejected,
        avgRating,
      },
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    res.status(500).json({ success: false, message: "Failed to load reviews", error: error.message });
  }
};

// @desc    Update review status (Approve / Reject / Pending)
// @route   PUT /api/reviews/admin/:id/status
// @access  Admin
export const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.status = status;
    review.isVerified = status === "approved";
    await review.save();

    res.status(200).json({
      success: true,
      message: `Review marked as ${status} successfully`,
      data: review,
    });
  } catch (error) {
    console.error("Error updating review status:", error);
    res.status(500).json({ success: false, message: "Failed to update review status", error: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/admin/:id
// @access  Admin
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ success: false, message: "Failed to delete review", error: error.message });
  }
};

// @desc    Mark review as helpful
// @route   PATCH /api/reviews/:id/helpful
// @access  Public
export const markReviewHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(id, { $inc: { helpful: 1 } }, { new: true });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    res.status(200).json({ success: true, helpful: review.helpful });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update helpful count" });
  }
};
