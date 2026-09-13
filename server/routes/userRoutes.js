const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token with special handling for dummy-token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Special handling for the dummy token used in development/testing
  if (token === 'dummy-token') {
    console.log('Using dummy token bypass for authentication');
    // Set a mock user for testing
    req.user = {
      id: 'dummy-user-id',
      role: 'parent',
      name: 'Test Parent',
      parentCode: 'parent0001'
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    console.log('JWT decoded successfully:', decoded);
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Get children for a parent
router.get('/children', verifyToken, async (req, res) => {
  try {
    console.log('Children endpoint accessed by user with role:', req.user.role);
    console.log('User ID from token:', req.user.id);
    
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    try {
      // Find children by parentId (which is the parent's _id)
      const children = await User.find({ parentId: req.user.id, role: 'child' });
      console.log('Found children:', children.length);
      
      // If no children found, return empty array (no sample data - this was confusing)
      if (!children || children.length === 0) {
        console.log('No children found in database for parent:', req.user.id);
        return res.json([]);
      }
      
      res.json(children);
    } catch (dbError) {
      console.error('Database error when fetching children:', dbError);
      res.status(500).json({ message: 'Database error fetching children' });
    }
  } catch (error) {
    console.error('Error in children endpoint:', error);
    res.status(500).json({ message: 'Error fetching children' });
  }
});

// Get children for a specific parent by parent ID
router.get('/parent/:parentId/children', verifyToken, async (req, res) => {
  try {
    const { parentId } = req.params;
    console.log('🔍 Fetching children for parent ID:', parentId);

    // First, check if parent exists
    const parent = await User.findById(parentId);
    if (!parent) {
      console.log('❌ Parent not found with ID:', parentId);
      return res.json([]);
    }
    console.log('✅ Parent found:', parent.name, 'with parentCode:', parent.parentCode);

    // Find children by parentId
    const children = await User.find({ parentId: parentId, role: 'child' });
    console.log('✅ Found children:', children.length);

    if (children.length > 0) {
      children.forEach(child => {
        console.log('  - Child:', child.name, 'ID:', child._id, 'parentId:', child.parentId);
      });
    } else {
      console.log('⚠️ No children found. Checking all children in database...');
      const allChildren = await User.find({ role: 'child' });
      console.log('  - Total children in DB:', allChildren.length);
      allChildren.forEach(child => {
        console.log('  - Child:', child.name, 'parentId:', child.parentId, 'matches?', child.parentId?.toString() === parentId);
      });
    }

    res.json(children);
  } catch (error) {
    console.error('❌ Error fetching children by parent ID:', error);
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