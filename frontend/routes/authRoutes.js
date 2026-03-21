const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, age, gender, email, password, role, parentId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      age,
      gender,
      email,
      password: hashedPassword,
      role,
      ...(role === "child" && { parentId }),
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, "secret", {
      expiresIn: "1h",
    });

    // If user is a parent, return their ID for child registration
    if (role === "parent") {
      return res.status(201).json({
        message: "Signup successful",
        parentId: user._id,
        token,
      });
    }

    res.status(201).json({ message: "Signup successful", token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

// Login Route (Modified to determine role based on email)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email only
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token with user's role
    const token = jwt.sign({ id: user._id, role: user.role }, "secret", {
      expiresIn: "1h",
    });
    
    // Return user role along with token and name
    res.json({ 
      message: "Login successful", 
      token, 
      role: user.role,
      name: user.name 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

module.exports = router;
