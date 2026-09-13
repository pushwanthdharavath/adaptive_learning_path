const mongoose = require('mongoose');

const mathQuizResultSchema = new mongoose.Schema({
  childName: { 
    type: String, 
    required: true 
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Replace difficulty-based scores with level-based scores
  level1Score: { 
    type: Number, 
    default: 0 
  },
  level2Score: { 
    type: Number, 
    default: 0 
  },
  level3Score: { 
    type: Number, 
    default: 0 
  },
  level4Score: { 
    type: Number, 
    default: 0 
  },
  level5Score: { 
    type: Number, 
    default: 0 
  },
  totalScore: { 
    type: Number, 
    default: 0 
  },
  completedAt: { 
    type: Date, 
    default: Date.now 
  },
  // Keep backward compatibility with old fields
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentName: {
    type: String
  },
  score: {
    type: Number
  },
  level: {
    type: Number
  },
  totalQuestions: {
    type: Number
  },
  details: {
    type: Object,
    default: {}
  }
});

// Use 'math_quiz_results' collection
module.exports = mongoose.model('MathQuizResult', mathQuizResultSchema, 'math_quiz_results');
