const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    const { gameType, result } = req.body;
    const userId = req.user.id;

    // Update user's game history
    await User.findByIdAndUpdate(userId, {
      $push: {
        gameHistory: {
          gameType,
          result,
          timestamp: new Date()
        }
      }
    });

    res.json({ message: 'Game result saved successfully' });
  } catch (error) {
    console.error('Error saving game result:', error);
    res.status(500).json({ message: 'Error saving game result' });
  }
});

// Submit test results and get learning path
router.post('/test-result', verifyToken, async (req, res) => {
  try {
    const { gameType, difficulty, score, totalQuestions, emotions } = req.body;
    const userId = req.user.id;

    // Calculate success rate
    const successRate = score / totalQuestions;

    // Analyze emotions
    const emotionAnalysis = analyzeEmotions(emotions);

    // Determine next difficulty and learning path
    const learningPath = determineLearningPath(successRate, emotionAnalysis, difficulty);

    // Update user's learning progress
    await User.findByIdAndUpdate(userId, {
      $push: {
        learningProgress: {
          gameType,
          difficulty,
          score,
          totalQuestions,
          successRate,
          emotionAnalysis,
          timestamp: new Date()
        }
      }
    });

    res.json({ learningPath });
  } catch (error) {
    console.error('Error processing test results:', error);
    res.status(500).json({ message: 'Error processing test results' });
  }
});

// Helper function to analyze emotions
function analyzeEmotions(emotions) {
  const emotionCounts = emotions.reduce((acc, emotion) => {
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {});

  const totalEmotions = emotions.length;
  return Object.entries(emotionCounts).reduce((acc, [emotion, count]) => {
    acc[emotion] = count / totalEmotions;
    return acc;
  }, {});
}

// Helper function to determine learning path
function determineLearningPath(successRate, emotionAnalysis, currentDifficulty) {
  let nextDifficulty = currentDifficulty;
  let recommendedQuestions = 5;
  let confidenceThreshold = 0.7;

  // Adjust difficulty based on success rate
  if (successRate >= 0.8) {
    nextDifficulty = increaseDifficulty(currentDifficulty);
  } else if (successRate <= 0.4) {
    nextDifficulty = decreaseDifficulty(currentDifficulty);
  }

  // Adjust questions based on emotional state
  if (emotionAnalysis.frustrated > 0.3) {
    recommendedQuestions = 3; // Reduce questions if frustrated
  } else if (emotionAnalysis.happy > 0.7) {
    recommendedQuestions = 7; // Increase questions if very engaged
  }

  // Adjust confidence threshold based on emotional state
  if (emotionAnalysis.confident > 0.6) {
    confidenceThreshold = 0.8; // Increase threshold if confident
  } else if (emotionAnalysis.anxious > 0.4) {
    confidenceThreshold = 0.6; // Decrease threshold if anxious
  }

  return {
    nextDifficulty,
    recommendedQuestions,
    confidenceThreshold
  };
}

// Helper function to increase difficulty
function increaseDifficulty(currentDifficulty) {
  const difficulties = ['easy', 'medium', 'hard'];
  const currentIndex = difficulties.indexOf(currentDifficulty);
  return difficulties[Math.min(currentIndex + 1, difficulties.length - 1)];
}

// Helper function to decrease difficulty
function decreaseDifficulty(currentDifficulty) {
  const difficulties = ['easy', 'medium', 'hard'];
  const currentIndex = difficulties.indexOf(currentDifficulty);
  return difficulties[Math.max(currentIndex - 1, 0)];
}

module.exports = router; 