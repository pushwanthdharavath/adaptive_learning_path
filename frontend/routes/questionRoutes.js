console.log("Loaded questionRoutes.js");
const express = require("express");
const router = express.Router();
const Question = require("../models/Question");

// Get questions by game and level, randomly shuffled
router.get("/", async (req, res) => {
  const { game, level } = req.query;
  const filter = {};
  if (game) filter.game = game;
  // Support both 'level' and 'difficulty' for compatibility
  if (level) {
    filter.$or = [
      { level: level },
      { difficulty: level }
    ];
  }

  try {
    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: 10 } },
    ]);
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk insert questions (for admin/initial upload via Postman)
router.post("/bulk", async (req, res) => {
  try {
    if (!Array.isArray(req.body.questions)) {
      return res
        .status(400)
        .json({ error: "Request body must contain a 'questions' array" });
    }

    await Question.insertMany(req.body.questions);
  } catch (e) {
    res.status(400).json({ error: e.message });
    res.json({ success: true, inserted: req.body.questions.length });
  }
});

router.get("/test", (req, res) => {
  res.json({ status: "questionRoutes.js is working" });
});

module.exports = router;
