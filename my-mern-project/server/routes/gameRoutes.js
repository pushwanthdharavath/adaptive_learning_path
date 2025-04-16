const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

// Save game result
router.post('/result', verifyToken, async (req, res) => {
  try {
    const { gameType, score, level, moves, timeElapsed } = req.body;
    const userId = req.user.id;

    const gameResult = new GameResult({
      userId,
      gameType,
      score,
      level,
      moves,
      timeElapsed,
      date: new Date()
    });

    await gameResult.save();
    res.json({ message: 'Game result saved successfully' });
  } catch (error) {
    console.error('Error saving game result:', error);
    res.status(500).json({ message: 'Error saving game result' });
  }
});

// Get game results for a child
router.get('/results/:childId', verifyToken, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify that the requesting user is the parent of the child
    const child = await User.findById(childId);
    if (!child || child.parentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Not authorized to view these results.' });
    }

    const results = await GameResult.find({ userId: childId }).sort({ date: -1 });
    
    // Separate results by game type
    const colorResults = results.filter(r => r.gameType === 'color');
    const puzzleResults = results.filter(r => r.gameType === 'puzzle');

    res.json({
      color: colorResults,
      puzzle: puzzleResults
    });
  } catch (error) {
    console.error('Error fetching game results:', error);
    res.status(500).json({ message: 'Error fetching game results' });
  }
});

module.exports = router;