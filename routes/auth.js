const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Token = require("../models/Token");
const { generateTokens, verifyToken } = require("../utils/tokens.utils");
const { JWT_REFRESH_SECRET, COOKIE_OPTIONS } = require("../config/jwt.config");

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user - remove the manual hashing
    const user = await User.create({
      email,
      password, // The model's pre-save middleware will hash this
      role: "user",
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    await Token.create({
      userId: user._id,
      refreshToken,
    });

    // Set cookies
    res.cookie("access_token", accessToken, COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      message: "User created successfully",
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    await Token.create({
      userId: user._id,
      refreshToken,
    });

    // Set cookies
    res.cookie("access_token", accessToken, COOKIE_OPTIONS);
    res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS);

    res.json({
      message: "Login successful",
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Token refresh endpoint
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies["refresh_token"];

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, JWT_REFRESH_SECRET);
    if (!decoded) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Check if refresh token exists in database
    const tokenDoc = await Token.findOne({
      userId: decoded.userId,
      refreshToken,
    });

    if (!tokenDoc) {
      return res
        .status(403)
        .json({ message: "Refresh token not found in database" });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token in database
    await Token.findByIdAndUpdate(tokenDoc._id, {
      refreshToken: tokens.refreshToken,
    });

    // Set new cookies
    res.cookie("access_token", tokens.accessToken, COOKIE_OPTIONS);
    res.cookie("refresh_token", tokens.refreshToken, COOKIE_OPTIONS);

    res.json({ message: "Tokens refreshed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error refreshing token", error: error.message });
  }
});

// Logout endpoint
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies["refresh_token"];

    // Remove refresh token from database if it exists
    if (refreshToken) {
      await Token.deleteOne({ refreshToken });
    }

    // Clear cookies
    res.clearCookie("access_token", COOKIE_OPTIONS);
    res.clearCookie("refresh_token", COOKIE_OPTIONS);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
});

module.exports = router;
