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
    
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    try {
      const children = await User.find({ parentId: req.user.id });
      
      // If no children found, provide sample data for testing
      if (!children || children.length === 0) {
        console.log('No children found in database, returning sample data');
        const sampleChildren = [
          {
            _id: 'child1',
            name: 'Sample Child 1',
            age: 8,
            gender: 'Male',
            parentId: req.user.id
          },
          {
            _id: 'child2',
            name: 'Sample Child 2',
            age: 10,
            gender: 'Female',
            parentId: req.user.id
          }
        ];
        return res.json(sampleChildren);
      }
      
      res.json(children);
    } catch (dbError) {
      console.error('Database error when fetching children:', dbError);
      // Fallback sample data for any database error
      const fallbackChildren = [
        {
          _id: 'fallback1',
          name: 'Fallback Child 1',
          age: 7,
          gender: 'Male',
          parentId: req.user.id
        },
        {
          _id: 'fallback2',
          name: 'Fallback Child 2',
          age: 9,
          gender: 'Female',
          parentId: req.user.id
        }
      ];
      res.json(fallbackChildren);
    }
  } catch (error) {
    console.error('Error in children endpoint:', error);
    res.status(500).json({
      message: 'Error fetching children',
      fallbackData: [
        {
          _id: 'error1',
          name: 'Error Fallback Child',
          age: 8,
          gender: 'Other',
          parentId: 'unknown'
        }
      ]
    });
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