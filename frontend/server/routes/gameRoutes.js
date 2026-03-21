const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GameResult = require('../models/GameResult');
const MathQuizResult = require('../models/MathQuizResult');

// Dummy math questions for demo
const DUMMY_QUESTIONS = {
  easy: [
    { question: '2 + 2 = ?', options: ['3', '4', '5', '6'], answer: '4', question_number: 1 },
    { question: '5 - 3 = ?', options: ['1', '2', '3', '4'], answer: '2', question_number: 2 },
    { question: '1 + 1 = ?', options: ['1', '2', '3', '4'], answer: '2', question_number: 3 },
  ],
  medium: [
    { question: '12 / 4 = ?', options: ['2', '3', '4', '5'], answer: '3', question_number: 4 },
    { question: '3 x 5 = ?', options: ['8', '15', '10', '12'], answer: '15', question_number: 5 },
    { question: '9 - 6 = ?', options: ['1', '2', '3', '4'], answer: '3', question_number: 6 },
  ],
  hard: [
    { question: '15 / 3 + 2 = ?', options: ['5', '7', '6', '8'], answer: '7', question_number: 7 },
    { question: '6 x 6 = ?', options: ['12', '24', '36', '48'], answer: '36', question_number: 8 },
    { question: '25 - 17 = ?', options: ['7', '8', '9', '10'], answer: '8', question_number: 9 },
  ]
};

// GET /api/questions?game=my-math-quiz&difficulty=easy
router.get('/questions', (req, res) => {
  const { game, difficulty } = req.query;
  if (game !== 'my-math-quiz') {
    return res.status(400).json({ error: 'Only my-math-quiz supported in demo.' });
  }
  const questions = DUMMY_QUESTIONS[difficulty] || [];
  res.json(questions);
});

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
    const { gameType, score, level, moves, timeElapsed, parentId: requestParentId, childName: requestChildName } = req.body;
    const userId = req.user.id;
    console.log('Received game result with data:', req.body);

    // Fetch the user's name from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create base game result object
    const gameResultData = {
      userId,
      userName: user.name, // Save the user's name alongside their ID
      gameType,
      score,
      level,
      moves,
      timeElapsed,
      date: new Date()
    };
    
    // If this is a math game, also store the child's name and parent ID
    if (gameType === 'math') {
      // Use the childName from the request if provided, otherwise use user.name
      gameResultData.childName = requestChildName || user.name;
      
      // Get parent ID - prioritize the one from request, then user's parentId, then userId if user is a parent
      let parentId = requestParentId;
      
      if (!parentId && user.parentId) {
        // If user has a parentId (they are a child), use that
        parentId = user.parentId;
        console.log(`Using parentId from user document: ${parentId}`);
      } else if (!parentId && user.role === 'parent') {
        // If user is a parent, they might be the parent themselves
        parentId = userId;
        console.log(`User is a parent, using their ID as parentId: ${parentId}`);
      }
      
      if (parentId) {
        gameResultData.parentId = parentId;
        console.log(`Setting parentId in game result: ${parentId}`);
      } else {
        console.log('No parentId available for this game result');
      }
    }
    
    const gameResult = new GameResult(gameResultData);

    await gameResult.save();
    console.log(`✅ Game result saved for user ${user.name} (ID: ${userId})`)
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

    // Get general game results
    const results = await GameResult.find({ userId: childId }).sort({ date: -1 });
    
    // Get math quiz specific results
    const mathQuizResults = await MathQuizResult.find({ studentId: childId }).sort({ date: -1 });
    
    // Separate results by game type
    const colorResults = results.filter(r => r.gameType === 'color');
    const puzzleResults = results.filter(r => r.gameType === 'puzzle');
    const mathResults = results.filter(r => r.gameType === 'math');
    
    // Combine both math results (from general GameResult and specific MathQuizResult)
    // Convert MathQuizResult format to match GameResult format for consistency
    const formattedMathQuizResults = mathQuizResults.map(result => ({
      _id: result._id,
      userId: result.studentId,
      userName: result.studentName || child.name, // Include the student name in the formatted results
      gameType: 'math',
      score: result.score,
      level: result.details.level || 1,  // Use level from details or default to 1
      difficulty: result.details.difficulty || 'medium',
      timeElapsed: result.details.timeElapsed || 0,
      date: result.date
    }));
    
    // Combine both sources of math results
    const combinedMathResults = [...mathResults, ...formattedMathQuizResults];
    
    res.json({
      color: colorResults,
      puzzle: puzzleResults,
      math: combinedMathResults
    });
  } catch (error) {
    console.error('Error fetching game results:', error);
    res.status(500).json({ message: 'Error fetching game results' });
  }
});

// Save Math Quiz result
router.post('/math-quiz-result', verifyToken, async (req, res) => {
  try {
    const { score, totalQuestions, details } = req.body;
    const userId = req.user.id;

    // Fetch student's name from User collection
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Find parent for this user if user is a child
    let parentId = null;
    if (user.role === 'child' && user.parentId) {
      parentId = user.parentId;
    } else {
      // If user is not a child, they may be submitting on behalf of a child
      // In this case, we'll assume they're the parent
      parentId = userId;
    }

    const mathQuizResult = new MathQuizResult({
      studentId: userId,
      studentName: user.name,
      childName: user.name, // Store child name explicitly
      parentId: parentId,
      score,
      totalQuestions,
      details: details || {},
      date: new Date()
    });
    res.json({ message: 'Math quiz result saved successfully' });
  } catch (error) {
    console.error('Error saving math quiz result:', error);
    res.status(500).json({ message: 'Error saving math quiz result' });
  }
});

// New route to get all math game results without authentication - FOR DEMO ONLY
router.get('/math-results', async (req, res) => {
  try {
    // Find all game results with gameType 'math'
    let mathResults = await GameResult.find({ gameType: 'math' }).sort({ date: -1 });
    
    // For any results without userName, try to fetch and add the user name
    const resultsToUpdate = [];
    for (let i = 0; i < mathResults.length; i++) {
      const result = mathResults[i];
      if (!result.userName && result.userId) {
        try {
          const user = await User.findById(result.userId);
          if (user) {
            mathResults[i] = {
              ...result._doc,
              userName: user.name
            };
            // Update the record in the database for future requests
            await GameResult.findByIdAndUpdate(result._id, { userName: user.name });
          }
        } catch (err) {
          console.error(`Could not fetch user name for result ${result._id}:`, err);
        }
      }
    }
    
    res.json(mathResults);
  } catch (error) {
    console.error('Error fetching math results:', error);
    res.status(500).json({ message: 'Error fetching math results' });
  }
});

// New route to get recent math game results without authentication - FOR DEMO ONLY
router.get('/recent-math-results', async (req, res) => {
  try {
    // Find the 10 most recent math game results
    let recentMathResults = await GameResult.find({ gameType: 'math' })
      .sort({ date: -1 })
      .limit(10);
    
    // For any results without userName, try to fetch and add the user name
    for (let i = 0; i < recentMathResults.length; i++) {
      const result = recentMathResults[i];
      if (!result.userName && result.userId) {
        try {
          const user = await User.findById(result.userId);
          if (user) {
            recentMathResults[i] = {
              ...result._doc,
              userName: user.name
            };
            // Update the record in the database for future requests
            await GameResult.findByIdAndUpdate(result._id, { userName: user.name });
            console.log(`Updated userName for result ${result._id} to ${user.name}`);
          }
        } catch (err) {
          console.error(`Could not fetch user name for result ${result._id}:`, err);
        }
      }
    }
    
    res.json(recentMathResults);
  } catch (error) {
    console.error('Error fetching recent math results:', error);
    res.status(500).json({ message: 'Error fetching recent math results' });
  }
});

module.exports = router;