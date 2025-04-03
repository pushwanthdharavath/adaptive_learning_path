const mongoose = require("mongoose");

const gameHistorySchema = new mongoose.Schema({
  gameType: {
    type: String,
    required: true,
    enum: ['puzzle', 'color']
  },
  result: {
    type: String,
    required: true,
    enum: ['win', 'lose']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const learningProgressSchema = new mongoose.Schema({
  gameType: {
    type: String,
    required: true,
    enum: ['puzzle', 'color']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  successRate: {
    type: Number,
    required: true
  },
  emotionAnalysis: {
    type: Map,
    of: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["parent", "child", "therapist"],
    required: true,
    lowercase: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () {
      return this.role === "child";
    },
  },
  isVerified: { type: Boolean, default: false },
  gameHistory: [gameHistorySchema],
  learningProgress: [learningProgressSchema]
});

module.exports = mongoose.model("User", UserSchema); 