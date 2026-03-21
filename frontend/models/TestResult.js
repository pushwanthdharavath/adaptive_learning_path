const mongoose = require("mongoose");

const EmotionSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  emotion: { type: String, required: true },
  confidence: { type: Number, required: true }
});

const TestResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  gameType: {
    type: String,
    enum: ["puzzle", "color"],
    required: true
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  emotions: [EmotionSchema],
  emotionAggregation: {
    confident: { type: Number, default: 0 },
    confused: { type: Number, default: 0 },
    frustrated: { type: Number, default: 0 },
    happy: { type: Number, default: 0 }
  },
  learningPath: {
    nextDifficulty: { type: String, enum: ["easy", "medium", "hard"] },
    recommendedQuestions: { type: Number },
    confidenceThreshold: { type: Number }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("TestResult", TestResultSchema); 