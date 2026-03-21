const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const GameResult = require("../models/GameResult");
const TestResult = require("../models/TestResult");
const path = require("path");
const { spawn } = require("child_process");

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, "secret", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Save game result
router.post("/result", authenticateToken, async (req, res) => {
  try {
    const { gameType, result } = req.body;
    const userId = req.user.id;
    
    // Fetch the user to get their name
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const gameResult = new GameResult({
      userId,
      userName: user.name, // Include the user's name
      gameType,
      result
    });

    await gameResult.save();
    console.log(`Game result saved successfully for user ${user.name}`);
    res.status(201).json({ message: "Game result saved successfully" });
  } catch (error) {
    console.error("Error saving game result:", error);
    res.status(500).json({ message: "Failed to save game result", error: error.message });
  }
});

// Get user's game history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const gameHistory = await GameResult.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json(gameHistory);
  } catch (error) {
    console.error("Error fetching game history:", error);
    res.status(500).json({ message: "Failed to fetch game history", error: error.message });
  }
});

// Save test result with emotions
router.post("/test-result", authenticateToken, async (req, res) => {
  try {
    const { gameType, difficulty, score, totalQuestions, emotions } = req.body;
    const userId = req.user.id;

    // Aggregate emotions
    const emotionAggregation = emotions.reduce((acc, curr) => {
      acc[curr.emotion] = (acc[curr.emotion] || 0) + 1;
      return acc;
    }, {});

    // Generate learning path based on score and emotions
    const learningPath = generateLearningPath(score, totalQuestions, emotionAggregation);

    const testResult = new TestResult({
      userId,
      gameType,
      difficulty,
      score,
      totalQuestions,
      emotions,
      emotionAggregation,
      learningPath
    });

    await testResult.save();
    res.status(201).json({ message: "Test result saved successfully", learningPath });
  } catch (error) {
    console.error("Error saving test result:", error);
    res.status(500).json({ message: "Failed to save test result", error: error.message });
  }
});

// Get user's test history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await TestResult.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json(history);
  } catch (error) {
    console.error("Error fetching test history:", error);
    res.status(500).json({ message: "Failed to fetch test history", error: error.message });
  }
});

// Helper function to generate learning path
function generateLearningPath(score, totalQuestions, emotions) {
  const scorePercentage = (score / totalQuestions) * 100;
  const confidenceLevel = emotions.confident || 0;
  const confusionLevel = emotions.confused || 0;

  let nextDifficulty;
  let recommendedQuestions;
  let confidenceThreshold;

  if (scorePercentage >= 80 && confidenceLevel > confusionLevel) {
    nextDifficulty = "hard";
    recommendedQuestions = 5;
    confidenceThreshold = 0.7;
  } else if (scorePercentage >= 60) {
    nextDifficulty = "medium";
    recommendedQuestions = 5;
    confidenceThreshold = 0.5;
  } else {
    nextDifficulty = "easy";
    recommendedQuestions = 5;
    confidenceThreshold = 0.3;
  }

  return {
    nextDifficulty,
    recommendedQuestions,
    confidenceThreshold
  };
}

// POST /next-difficulties: Call maggy/app2.py and return predicted difficulties
router.post("/next-difficulties", authenticateToken, async (req, res) => {
  try {
    const { score, average_expression_probabilities } = req.body;
    // Path to maggy/app2.py
    const maggyScript = path.join(__dirname, "..", "..", "maggy", "app2.py");
    // Prepare input for Python script
    const input = JSON.stringify({ score, average_expression_probabilities });
    let outputData = "";
    let errorData = "";
    // Spawn Python process
    const py = spawn("python", [maggyScript, "--api"], { stdio: ["pipe", "pipe", "pipe"] });
    py.stdin.write(input);
    py.stdin.end();
    py.stdout.on("data", (data) => {
      outputData += data.toString();
    });
    py.stderr.on("data", (data) => {
      errorData += data.toString();
    });
    py.on("close", (code) => {
      if (code !== 0 || errorData) {
        return res.status(500).json({ error: "Python error", details: errorData });
      }
      try {
        const result = JSON.parse(outputData);
        res.json({ predicted_difficulties: result.predicted_difficulties });
      } catch (err) {
        res.status(500).json({ error: "Failed to parse Python output", details: outputData });
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to run maggy/app2.py", details: err.message });
  }
});

module.exports = router; 