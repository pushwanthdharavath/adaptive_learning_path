const mongoose = require('mongoose');

const gameProgressSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  childName: {
    type: String,
    required: true
  },
  gameType: {
    type: String,
    enum: ['math', 'english', 'science', 'tricky'],
    required: true
  },
  // Level progress tracking
  currentLevel: {
    type: Number,
    default: 1
  },
  unlockedLevels: {
    type: [Number],
    default: [1]
  },
  starsPerLevel: {
    type: Map,
    of: Number,
    default: {}
  },
  // Complete game history
  gameHistory: [{
    level: Number,
    score: Number,
    correctAnswers: Number,
    wrongAnswers: Number,
    totalQuestions: Number,
    questions: [{
      question: String,
      options: [String],
      correctAnswer: String,
      userAnswer: String,
      isCorrect: Boolean
    }],
    emotion: String,
    expressionSamples: [String],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Overall statistics
  totalGamesPlayed: {
    type: Number,
    default: 0
  },
  highScore: {
    type: Number,
    default: 0
  },
  highestLevelReached: {
    type: Number,
    default: 1
  },
  // Reset flag for "play again" functionality
  needsReset: {
    type: Boolean,
    default: false
  },
  lastPlayed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
gameProgressSchema.index({ childId: 1, gameType: 1 });

module.exports = mongoose.model('GameProgress', gameProgressSchema);
