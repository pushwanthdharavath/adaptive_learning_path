const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Question Schema
const QuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: String
});

const Question = mongoose.model('Question', QuestionSchema);

// Get questions by difficulty and emotion
router.get('/', async (req, res) => {
  console.log('🔍 Request received for questions');

  try {
    const { level, emotion } = req.query;
    console.log('📍 Fetching questions:', { level, emotion });

    let difficulty;
    if (level === '1') {
      difficulty = 'easy';
    } else {
      // Adjust difficulty based on emotion
      if (emotion === 'happy' || emotion === 'neutral') {
        difficulty = 'medium';
      } else if (emotion === 'confused' || emotion === 'frustrated') {
        difficulty = 'easy';
      } else {
        difficulty = 'medium'; // Default
      }
    }

    // Get random questions of specified difficulty
    const questions = await Question.aggregate([
      { $match: { difficulty } },
      { $sample: { size: 5 } }
    ]);

    console.log(`✅ Found ${questions.length} ${difficulty} questions`);
    res.json(questions);
  } catch (err) {
    console.error('❌ Error fetching questions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add sample questions if none exist or force refresh
const initializeQuestions = async () => {
  console.log('🔍 Checking for existing questions...');
  
  // Force refresh questions (delete existing and add new ones)
  try {
    console.log('🔄 Clearing existing questions...');
    await Question.deleteMany({});
    console.log('✅ Existing questions cleared');
  } catch (error) {
    console.error('❌ Error clearing questions:', error);
  }
  
  // Add new questions
  try {
    console.log('📍 Initializing sample questions...');
    const sampleQuestions = [
      // Easy questions (for level 1) - Added more to ensure at least 5
      {
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        difficulty: 'easy',
        category: 'addition'
      },
      {
        question: 'What is 5 + 3?',
        options: ['7', '8', '9', '10'],
        correctAnswer: '8',
        difficulty: 'easy',
        category: 'addition'
      },
      {
        question: 'What is 1 + 6?',
        options: ['5', '6', '7', '8'],
        correctAnswer: '7',
        difficulty: 'easy',
        category: 'addition'
      },
      {
        question: 'What is 4 + 4?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        difficulty: 'easy',
        category: 'addition'
      },
      {
        question: 'What is 5 x 3?',
        options: ['12', '15', '18', '20'],
        correctAnswer: '15',
        difficulty: 'easy',
        category: 'multiplication'
      },
      {
        question: 'What is 10 - 5?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '5',
        difficulty: 'easy',
        category: 'subtraction'
      },
      {
        question: 'What is 6 ÷ 2?',
        options: ['2', '3', '4', '5'],
        correctAnswer: '3',
        difficulty: 'easy',
        category: 'division'
      },
      // Medium questions
      {
        question: 'What is 8 ÷ 2?',
        options: ['2', '3', '4', '6'],
        correctAnswer: '4',
        difficulty: 'medium',
        category: 'division'
      },
      {
        question: 'What is 15 - 7?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        difficulty: 'medium',
        category: 'subtraction'
      },
      {
        question: 'What is 6 x 4?',
        options: ['22', '24', '26', '28'],
        correctAnswer: '24',
        difficulty: 'medium',
        category: 'multiplication'
      },
      {
        question: 'What is 18 + 7?',
        options: ['23', '24', '25', '26'],
        correctAnswer: '25',
        difficulty: 'medium',
        category: 'addition'
      },
      {
        question: 'What is 20 ÷ 5?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        difficulty: 'medium',
        category: 'division'
      },
      // Hard questions
      {
        question: 'What is 12 x 4?',
        options: ['44', '46', '48', '50'],
        correctAnswer: '48',
        difficulty: 'hard',
        category: 'multiplication'
      },
      {
        question: 'What is 72 ÷ 9?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        difficulty: 'hard',
        category: 'division'
      },
      {
        question: 'What is 37 + 48?',
        options: ['75', '80', '85', '90'],
        correctAnswer: '85',
        difficulty: 'hard',
        category: 'addition'
      },
      {
        question: 'What is 64 - 27?',
        options: ['35', '37', '39', '41'],
        correctAnswer: '37',
        difficulty: 'hard',
        category: 'subtraction'
      },
      {
        question: 'What is 15 x 6?',
        options: ['80', '85', '90', '95'],
        correctAnswer: '90',
        difficulty: 'hard',
        category: 'multiplication'
      }
    ];

    await Question.insertMany(sampleQuestions);
    console.log('✅ Sample questions initialized');
  } catch (error) {
    console.error('❌ Error initializing questions:', error);
  }
};

initializeQuestions();

module.exports = router;
