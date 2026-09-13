const express = require('express');
const router = express.Router();
const GameProgress = require('../models/GameProgress');

// Save game progress after completing a level
router.post('/save', async (req, res) => {
  try {
    const {
      childId,
      childName,
      parentId,
      gameType,
      level,
      score,
      correctAnswers,
      wrongAnswers,
      totalQuestions,
      questions,
      emotion,
      expressionSamples
    } = req.body;

    console.log('💾 Saving game progress:', { childId, gameType, level, score });

    // Find or create game progress
    let progress = await GameProgress.findOne({ childId, gameType });

    if (!progress) {
      progress = new GameProgress({
        childId,
        childName,
        parentId,
        gameType,
        currentLevel: 1,
        unlockedLevels: [1],
        starsPerLevel: {},
        gameHistory: [],
        totalGamesPlayed: 0,
        highScore: 0,
        highestLevelReached: 1
      });
    }

    // Add this game to history
    progress.gameHistory.push({
      level,
      score,
      correctAnswers,
      wrongAnswers,
      totalQuestions,
      questions,
      emotion,
      expressionSamples,
      timestamp: new Date()
    });

    // Update statistics
    progress.totalGamesPlayed += 1;
    progress.highScore = Math.max(progress.highScore || 0, score);
    progress.highestLevelReached = Math.max(progress.highestLevelReached, level);
    progress.lastPlayed = new Date();

    // Calculate stars for this level (3 stars = 100%, 2 stars = 80%, 1 star = 60%)
    const accuracy = correctAnswers / totalQuestions;
    let stars = 0;
    if (accuracy >= 1) stars = 3;
    else if (accuracy >= 0.8) stars = 2;
    else if (accuracy >= 0.6) stars = 1;

    // Update stars for this level (keep maximum stars)
    const currentStars = progress.starsPerLevel.get(level.toString()) || 0;
    progress.starsPerLevel.set(level.toString(), Math.max(currentStars, stars));

    // Unlock next level if this level was completed
    if (level < 5 && !progress.unlockedLevels.includes(level + 1)) {
      progress.unlockedLevels.push(level + 1);
      progress.currentLevel = level + 1;
    } else if (level === 5) {
      // All levels completed - mark for reset prompt
      progress.needsReset = true;
    }

    await progress.save();

    console.log('✅ Game progress saved successfully');
    res.json({
      success: true,
      unlockedLevels: progress.unlockedLevels,
      currentLevel: progress.currentLevel,
      starsPerLevel: Object.fromEntries(progress.starsPerLevel),
      needsReset: progress.needsReset
    });
  } catch (error) {
    console.error('❌ Error saving game progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get child's progress for a specific game
router.get('/:childId/:gameType', async (req, res) => {
  try {
    const { childId, gameType } = req.params;

    const progress = await GameProgress.findOne({ childId, gameType });

    if (!progress) {
      // Return default progress for new player
      return res.json({
        currentLevel: 1,
        unlockedLevels: [1],
        starsPerLevel: {},
        totalGamesPlayed: 0,
        highScore: 0,
        highestLevelReached: 1,
        needsReset: false
      });
    }

    res.json({
      currentLevel: progress.currentLevel,
      unlockedLevels: progress.unlockedLevels,
      starsPerLevel: Object.fromEntries(progress.starsPerLevel),
      totalGamesPlayed: progress.totalGamesPlayed,
      highScore: progress.highScore || 0,
      highestLevelReached: progress.highestLevelReached,
      needsReset: progress.needsReset
    });
  } catch (error) {
    console.error('❌ Error fetching game progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get complete game history for a child
router.get('/history/:childId', async (req, res) => {
  try {
    const { childId } = req.params;

    const allProgress = await GameProgress.find({ childId });

    const history = {};
    allProgress.forEach(progress => {
      history[progress.gameType] = {
        gameType: progress.gameType,
        gameHistory: progress.gameHistory,
        totalGamesPlayed: progress.totalGamesPlayed,
        highScore: progress.highScore || 0,
        highestLevelReached: progress.highestLevelReached
      };
    });

    res.json(history);
  } catch (error) {
    console.error('❌ Error fetching game history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all children's game history (for teachers)
router.get('/all-children', async (req, res) => {
  try {
    const allProgress = await GameProgress.find({})
      .populate('childId', 'name email')
      .populate('parentId', 'name email');

    // Group by child
    const childrenHistory = {};
    allProgress.forEach(progress => {
      // Handle both populated and non-populated childId
      const childIdStr = progress.childId?._id?.toString() || progress.childId?.toString() || progress.childId;
      
      if (!childIdStr) {
        console.warn('Skipping progress record with missing childId:', progress._id);
        return;
      }

      if (!childrenHistory[childIdStr]) {
        childrenHistory[childIdStr] = {
          childId: childIdStr,
          childName: progress.childName || 'Unknown',
          childEmail: progress.childId?.email || 'N/A',
          parentId: progress.parentId?._id?.toString() || progress.parentId?.toString() || progress.parentId,
          parentName: progress.parentId?.name || 'Unknown',
          games: {}
        };
      }

      childrenHistory[childIdStr].games[progress.gameType] = {
        gameType: progress.gameType,
        gameHistory: progress.gameHistory || [],
        totalGamesPlayed: progress.totalGamesPlayed || 0,
        highScore: progress.highScore || 0,
        highestLevelReached: progress.highestLevelReached || 1,
        lastPlayed: progress.lastPlayed
      };
    });

    res.json(Object.values(childrenHistory));
  } catch (error) {
    console.error('❌ Error fetching all children history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset game progress (play again)
router.post('/reset', async (req, res) => {
  try {
    const { childId, gameType } = req.body;

    const progress = await GameProgress.findOne({ childId, gameType });

    if (!progress) {
      return res.status(404).json({ error: 'Game progress not found' });
    }

    // Reset to level 1
    progress.currentLevel = 1;
    progress.unlockedLevels = [1];
    progress.starsPerLevel = new Map();
    progress.needsReset = false;

    await progress.save();

    console.log('✅ Game progress reset successfully');
    res.json({
      success: true,
      currentLevel: 1,
      unlockedLevels: [1],
      starsPerLevel: {}
    });
  } catch (error) {
    console.error('❌ Error resetting game progress:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
