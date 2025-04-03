const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Get children for a parent
router.get('/children', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const children = await User.find({ parentId: req.user.id });
    res.json(children);
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ message: 'Error fetching children' });
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

module.exports = router; 