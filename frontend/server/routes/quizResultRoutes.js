const express = require('express');
const router = express.Router();
const MathQuizResult = require('../models/MathQuizResult');

// Save quiz result
router.post('/', async (req, res) => {
  try {
    const { childName, parentId, level, score } = req.body;
    
    if (!childName || !parentId || !level) {
      return res.status(400).json({ message: 'childName, parentId, and level are required' });
    }
    
    // Create result object with default values for all level scores
    const resultData = {
      childName,
      parentId,
      level1Score: 0,
      level2Score: 0,
      level3Score: 0,
      level4Score: 0,
      level5Score: 0,
      totalScore: score || 0
    };
    
    // Set the score for the specified level
    const levelField = `level${level}Score`;
    resultData[levelField] = score || 0;
    
    const quizResult = new MathQuizResult(resultData);
    
    await quizResult.save();
    res.status(201).json({ 
      message: 'Quiz result saved successfully', 
      quizResult 
    });
  } catch (error) {
    console.error('Error saving quiz result:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get quiz results by parent ID
router.get('/parent/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;
    const quizResults = await MathQuizResult.find({ parentId })
      .sort({ completedAt: -1 });
    
    res.status(200).json(quizResults);
  } catch (error) {
    console.error('Error fetching quiz results by parent:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get quiz results by child name
router.get('/child/:childName', async (req, res) => {
  try {
    const { childName } = req.params;
    const quizResults = await MathQuizResult.find({ childName })
      .sort({ completedAt: -1 });
    
    res.status(200).json(quizResults);
  } catch (error) {
    console.error('Error fetching quiz results by child name:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all quiz results (for therapist dashboard)
router.get('/', async (req, res) => {
  try {
    const quizResults = await MathQuizResult.find({})
      .sort({ completedAt: -1 });
    
    res.status(200).json(quizResults);
  } catch (error) {
    console.error('Error fetching all quiz results:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get quiz result statistics
router.get('/stats', async (req, res) => {
  try {
    // Get overall statistics
    const totalResults = await MathQuizResult.countDocuments();
    const totalChildren = await MathQuizResult.distinct('childName');
    
    // Get average scores by level
    const averageScores = await MathQuizResult.aggregate([
      {
        $group: {
          _id: null,
          avgLevel1Score: { $avg: "$level1Score" },
          avgLevel2Score: { $avg: "$level2Score" },
          avgLevel3Score: { $avg: "$level3Score" },
          avgLevel4Score: { $avg: "$level4Score" },
          avgLevel5Score: { $avg: "$level5Score" },
          avgTotalScore: { $avg: "$totalScore" }
        }
      }
    ]);
    
    res.status(200).json({
      totalResults,
      totalUniqueChildren: totalChildren.length,
      averageScores: averageScores[0] || {
        avgLevel1Score: 0,
        avgLevel2Score: 0,
        avgLevel3Score: 0,
        avgLevel4Score: 0,
        avgLevel5Score: 0,
        avgTotalScore: 0
      }
    });
  } catch (error) {
    console.error('Error fetching quiz result statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
