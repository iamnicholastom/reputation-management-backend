const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const { authenticateToken } = require("../middleware/auth");

// Public Routes (No Authentication Required)

// Get paginated reviews
router.get("/", async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    // Convert to numbers and ensure they are valid
    page = Math.max(parseInt(page, 10), 1);
    limit = Math.max(parseInt(limit, 10), 1);

    const totalReviews = await Review.countDocuments();
    const totalPages = Math.ceil(totalReviews / limit);

    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      page,
      limit,
      totalReviews,
      totalPages,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one review
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected Routes (Authentication Required)

// Create a review
router.post("/", authenticateToken, async (req, res) => {
  try {
    const review = new Review({
      ...req.body,
      userId: req.user._id, // Optional: If you want to associate reviews with users
    });
    const savedReview = await review.save();
    res.status(201).json(savedReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a review
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    // Optional: Add check to ensure user can only update their own reviews
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a review
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    // Optional: Add check to ensure user can only delete their own reviews
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
