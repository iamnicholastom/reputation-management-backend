const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60, // Automatically delete after 7 days
  },
});

// Index for quick lookups and unique constraint
tokenSchema.index({ userId: 1, refreshToken: 1 }, { unique: true });

module.exports = mongoose.model("Token", tokenSchema);
