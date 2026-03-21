const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const MathQuizResult = require('../models/MathQuizResult');
const GameResult = require('../models/GameResult');

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

// Get all children assigned to a therapist
router.get('/children', verifyToken, async (req, res) => {
  try {
    console.log('GET /api/therapist/children endpoint called');
    const therapistId = req.user.id;
    
    // Verify user is a therapist
    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.role !== 'therapist') {
      return res.status(403).json({ message: 'Access denied. User is not a therapist.' });
    }

    // Find all children assigned to this therapist
    const children = await User.find({ 
      therapistId: therapistId,
      role: 'child'
    }).select('_id name age parentId');
    
    // If no children found, return sample data for testing
    if (children.length === 0) {
      console.log('No children found, returning sample data for testing');
      return res.json([
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Alex Johnson',
          age: 8,
          parentName: 'Sarah Johnson'
        },
        {
          _id: '507f1f77bcf86cd799439022',
          name: 'Emma Davis',
          age: 7,
          parentName: 'Michael Davis'
        },
        {
          _id: '507f1f77bcf86cd799439033',
          name: 'Ryan Miller',
          age: 9,
          parentName: 'Jennifer Miller'
        }
      ]);
    }
    
    // Get parent names for each child
    const childrenWithParents = await Promise.all(children.map(async (child) => {
      let parentName = 'Unknown';
      if (child.parentId) {
        const parent = await User.findById(child.parentId).select('name');
        if (parent) parentName = parent.name;
      }
      
      return {
        ...child.toObject(),
        parentName
      };
    }));

    res.json(childrenWithParents);
  } catch (error) {
    console.error('Error fetching children for therapist:', error);
    res.status(500).json({ message: 'Error fetching children' });
  }
});

// Get detailed information about a specific child
router.get('/child/:childId', verifyToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const therapistId = req.user.id;
    
    // Verify user is a therapist
    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.role !== 'therapist') {
      return res.status(403).json({ message: 'Access denied. User is not a therapist.' });
    }
    
    // Verify the child is assigned to this therapist
    const child = await User.findOne({ 
      _id: childId,
      therapistId: therapistId,
      role: 'child'
    });
    
    if (!child) {
      return res.status(403).json({ message: 'Access denied. Child not assigned to this therapist.' });
    }
    
    // Get parent information
    let parent = null;
    if (child.parentId) {
      parent = await User.findById(child.parentId).select('name email');
    }
    
    // Get additional details like notes, assessment scores, etc.
    // This is where you would add more information from other collections
    
    res.json({
      child: {
        _id: child._id,
        name: child.name,
        age: child.age,
        email: child.email
      },
      parent: parent ? {
        name: parent.name,
        email: parent.email
      } : null,
      // Add other details here
    });
  } catch (error) {
    console.error('Error fetching child details:', error);
    res.status(500).json({ message: 'Error fetching child details' });
  }
});

// Save therapist notes for a child
router.post('/notes/:childId', verifyToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const { notes } = req.body;
    const therapistId = req.user.id;
    
    // Verify user is a therapist
    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.role !== 'therapist') {
      return res.status(403).json({ message: 'Access denied. User is not a therapist.' });
    }
    
    // Verify the child is assigned to this therapist
    const child = await User.findOne({ 
      _id: childId,
      therapistId: therapistId,
      role: 'child'
    });
    
    if (!child) {
      return res.status(403).json({ message: 'Access denied. Child not assigned to this therapist.' });
    }
    
    // Update the child with the new notes
    // You might want to create a separate collection for notes in a real application
    child.therapistNotes = notes;
    await child.save();
    
    res.json({ message: 'Notes saved successfully' });
  } catch (error) {
    console.error('Error saving therapist notes:', error);
    res.status(500).json({ message: 'Error saving notes' });
  }
});

// Get game results for a specific child - for therapist dashboard
router.get('/game-results/:childId', verifyToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const therapistId = req.user.id;
    
    // Verify user is a therapist
    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.role !== 'therapist') {
      return res.status(403).json({ message: 'Access denied. User is not a therapist.' });
    }
    
    // Verify the child is assigned to this therapist (or if using sample data, allow access)
    const child = await User.findOne({ 
      _id: childId,
      therapistId: therapistId,
      role: 'child'
    });
    
    // Allow access to sample data IDs for demonstration purposes
    const isSampleData = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439022', '507f1f77bcf86cd799439033'].includes(childId);
    
    if (!child && !isSampleData) {
      return res.status(403).json({ message: 'Access denied. Child not assigned to this therapist.' });
    }
    
    // Get the child's name from either the database or sample data
    let childName = child ? child.name : null;
    if (!childName && isSampleData) {
      if (childId === '507f1f77bcf86cd799439011') childName = 'Alex Johnson';
      else if (childId === '507f1f77bcf86cd799439022') childName = 'Emma Davis';
      else if (childId === '507f1f77bcf86cd799439033') childName = 'Ryan Miller';
    }
    
    // Fetch all game results related to this child from both GameResult and MathQuizResult collections
    const gameResults = await GameResult.find({
      $or: [
        { userId: childId },
        { childName: childName }
      ],
      gameType: 'math'
    }).sort({ date: -1 });
    
    // Also fetch results from MathQuizResult if available
    const mathQuizResults = await MathQuizResult.find({
      $or: [
        { studentId: childId },
        { childName: childName }
      ]
    }).sort({ completedAt: -1 });
    
    // Format the MathQuizResults to match the GameResult format
    const formattedMathResults = mathQuizResults.map(result => ({
      _id: result._id,
      userId: result.studentId,
      userName: result.studentName || childName,
      childName: result.childName || childName,
      gameType: 'math',
      score: result.score || 0,
      level: result.level || 1,
      date: result.completedAt || new Date()
    }));
    
    // Combine both sources of results
    const combinedResults = [...gameResults, ...formattedMathResults];
    
    // If no results found, return empty array
    if (combinedResults.length === 0) {
      return res.json([]);
    }
    
    res.json(combinedResults);
  } catch (error) {
    console.error('Error fetching game results for child:', error);
    res.status(500).json({ message: 'Error fetching game results' });
  }
});

module.exports = router;
