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
    const { level, emotion, correctAnswers, wrongAnswers, totalQuestions, category } = req.query;
    console.log('📍 Fetching questions:', { level, emotion, correctAnswers, wrongAnswers, totalQuestions, category });

    let difficulty;
    let performanceScore = 0;
    
    // Calculate performance score based on correct/wrong answers
    if (correctAnswers && totalQuestions) {
      performanceScore = parseInt(correctAnswers) / parseInt(totalQuestions);
    } else if (correctAnswers && wrongAnswers) {
      const total = parseInt(correctAnswers) + parseInt(wrongAnswers);
      performanceScore = parseInt(correctAnswers) / total;
    }
    
    console.log(`📊 Performance score: ${performanceScore.toFixed(2)} (${(performanceScore * 100).toFixed(0)}%)`);

    // Base difficulty on level
    if (level === '1') {
      // Level 1: ALL easy questions
      difficulty = 'easy';
      console.log(`🎮 Level 1: All easy questions`);
    } else {
      // Level 2+: Mix questions based on performance and expressions
      let emotionFactor = 0; // -1 for easy, 0 for medium, 1 for hard
      let performanceFactor = 0; // -1 for easy, 0 for medium, 1 for hard
      
      // Emotion factor
      if (emotion === 'happy' || emotion === 'surprised') {
        emotionFactor = 1; // Increase difficulty
      } else if (emotion === 'sad' || emotion === 'angry' || emotion === 'confused' || emotion === 'frustrated') {
        emotionFactor = -1; // Decrease difficulty
      } else {
        emotionFactor = 0; // Keep same
      }
      
      // Performance factor
      if (performanceScore >= 0.8) {
        performanceFactor = 1; // High performance → harder
      } else if (performanceScore >= 0.5) {
        performanceFactor = 0; // Average performance → medium
      } else {
        performanceFactor = -1; // Low performance → easier
      }
      
      // Combine factors (performance has more weight)
      const combinedScore = (performanceFactor * 0.7) + (emotionFactor * 0.3);
      
      console.log(`🎯 Combined adaptability score: ${combinedScore.toFixed(2)}`);
      console.log(`   - Performance factor: ${performanceFactor} (weight: 0.7)`);
      console.log(`   - Emotion factor: ${emotionFactor} (weight: 0.3)`);
      
      // Determine difficulty based on combined score
      if (combinedScore >= 0.5) {
        difficulty = 'hard';
      } else if (combinedScore <= -0.5) {
        difficulty = 'easy';
      } else {
        difficulty = 'medium';
      }
    }

    console.log(`🎮 Final difficulty: ${difficulty}`);
    console.log(`   Reasoning: ${getDifficultyReasoning(emotion, performanceScore, difficulty)}`);

    // Get questions - for mixed difficulty, return appropriate mix
    let questions;
    const categoryFilter = category ? { category } : {};

    if (level === '1') {
      // Level 1: All easy
      questions = await Question.aggregate([
        { $match: { difficulty: 'easy', ...categoryFilter } },
        { $sample: { size: 5 } }
      ]);
    } else if (difficulty === 'easy') {
      // Poor performance: Mostly easy (4) + one medium (1)
      const easyQuestions = await Question.aggregate([
        { $match: { difficulty: 'easy', ...categoryFilter } },
        { $sample: { size: 4 } }
      ]);
      const mediumQuestions = await Question.aggregate([
        { $match: { difficulty: 'medium', ...categoryFilter } },
        { $sample: { size: 1 } }
      ]);
      questions = [...easyQuestions, ...mediumQuestions];
    } else if (difficulty === 'hard') {
      // Excellent performance: Mix of medium (2) and hard (3)
      const mediumQuestions = await Question.aggregate([
        { $match: { difficulty: 'medium', ...categoryFilter } },
        { $sample: { size: 2 } }
      ]);
      const hardQuestions = await Question.aggregate([
        { $match: { difficulty: 'hard', ...categoryFilter } },
        { $sample: { size: 3 } }
      ]);
      questions = [...mediumQuestions, ...hardQuestions];
    } else {
      // Medium performance: Mix of easy (2), medium (2), hard (1)
      const easyQuestions = await Question.aggregate([
        { $match: { difficulty: 'easy', ...categoryFilter } },
        { $sample: { size: 2 } }
      ]);
      const mediumQuestions = await Question.aggregate([
        { $match: { difficulty: 'medium', ...categoryFilter } },
        { $sample: { size: 2 } }
      ]);
      const hardQuestions = await Question.aggregate([
        { $match: { difficulty: 'hard', ...categoryFilter } },
        { $sample: { size: 1 } }
      ]);
      questions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];
    }

    console.log(`✅ Found ${questions.length} ${difficulty} questions`);
    res.json(questions);
  } catch (err) {
    console.error('❌ Error fetching questions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to explain difficulty decision
function getDifficultyReasoning(emotion, performanceScore, difficulty) {
  const perfPercent = performanceScore ? (performanceScore * 100).toFixed(0) : 'N/A';
  
  if (difficulty === 'easy') {
    return `Child needs easier questions (emotion: ${emotion}, performance: ${perfPercent}%)`;
  } else if (difficulty === 'hard') {
    return `Child ready for challenge (emotion: ${emotion}, performance: ${perfPercent}%)`;
  } else {
    return `Child at appropriate level (emotion: ${emotion}, performance: ${perfPercent}%)`;
  }
}

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
        category: 'math'
      },
      {
        question: 'What is 5 + 3?',
        options: ['7', '8', '9', '10'],
        correctAnswer: '8',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 1 + 6?',
        options: ['5', '6', '7', '8'],
        correctAnswer: '7',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 4 + 4?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 3 + 5?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 2 + 7?',
        options: ['8', '9', '10', '11'],
        correctAnswer: '9',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 6 + 3?',
        options: ['7', '8', '9', '10'],
        correctAnswer: '9',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 5 x 3?',
        options: ['12', '15', '18', '20'],
        correctAnswer: '15',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 10 - 5?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '5',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 8 - 3?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '5',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 12 - 4?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 6 ÷ 2?',
        options: ['2', '3', '4', '5'],
        correctAnswer: '3',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 8 ÷ 2?',
        options: ['2', '3', '4', '5'],
        correctAnswer: '4',
        difficulty: 'easy',
        category: 'math'
      },
      {
        question: 'What is 10 ÷ 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '5',
        difficulty: 'easy',
        category: 'math'
      },
      // Medium questions
      {
        question: 'What is 8 ÷ 2?',
        options: ['2', '3', '4', '6'],
        correctAnswer: '4',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 15 - 7?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 6 x 4?',
        options: ['22', '24', '26', '28'],
        correctAnswer: '24',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 18 + 7?',
        options: ['23', '24', '25', '26'],
        correctAnswer: '25',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 20 ÷ 5?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 14 + 13?',
        options: ['25', '26', '27', '28'],
        correctAnswer: '27',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 32 - 15?',
        options: ['15', '16', '17', '18'],
        correctAnswer: '17',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 7 x 5?',
        options: ['30', '32', '35', '40'],
        correctAnswer: '35',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 45 ÷ 5?',
        options: ['7', '8', '9', '10'],
        correctAnswer: '9',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 27 + 18?',
        options: ['43', '44', '45', '46'],
        correctAnswer: '45',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 56 - 23?',
        options: ['31', '32', '33', '34'],
        correctAnswer: '33',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 8 x 6?',
        options: ['44', '46', '48', '50'],
        correctAnswer: '48',
        difficulty: 'medium',
        category: 'math'
      },
      {
        question: 'What is 63 ÷ 7?',
        options: ['7', '8', '9', '10'],
        correctAnswer: '9',
        difficulty: 'medium',
        category: 'math'
      },
      // Hard questions
      {
        question: 'What is 12 x 4?',
        options: ['44', '46', '48', '50'],
        correctAnswer: '48',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 72 ÷ 9?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 37 + 48?',
        options: ['75', '80', '85', '90'],
        correctAnswer: '85',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 64 - 27?',
        options: ['35', '37', '39', '41'],
        correctAnswer: '37',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 15 x 6?',
        options: ['80', '85', '90', '95'],
        correctAnswer: '90',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 144 ÷ 12?',
        options: ['10', '11', '12', '13'],
        correctAnswer: '12',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 89 + 67?',
        options: ['146', '148', '156', '166'],
        correctAnswer: '156',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 25 x 8?',
        options: ['190', '195', '200', '210'],
        correctAnswer: '200',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 156 - 89?',
        options: ['65', '67', '69', '71'],
        correctAnswer: '67',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 96 ÷ 8?',
        options: ['10', '11', '12', '13'],
        correctAnswer: '12',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 18 x 7?',
        options: ['118', '124', '126', '134'],
        correctAnswer: '126',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 108 ÷ 9?',
        options: ['10', '11', '12', '13'],
        correctAnswer: '12',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 234 + 156?',
        options: ['380', '388', '390', '400'],
        correctAnswer: '390',
        difficulty: 'hard',
        category: 'math'
      },
      {
        question: 'What is 345 - 178?',
        options: ['165', '167', '169', '171'],
        correctAnswer: '167',
        difficulty: 'hard',
        category: 'math'
      },
      // English questions (17 easy, 16 medium, 18 hard)
      {
        question: "What is the opposite of 'big'?",
        options: ["Small", "Tall", "Fast", "Slow"],
        correctAnswer: "Small",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "Which word is a color?",
        options: ["Run", "Blue", "Jump", "Eat"],
        correctAnswer: "Blue",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "What animal says 'meow'?",
        options: ["Dog", "Cat", "Bird", "Fish"],
        correctAnswer: "Cat",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "Which word means 'happy'?",
        options: ["Sad", "Angry", "Joyful", "Tired"],
        correctAnswer: "Joyful",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "How many letters are in 'apple'?",
        options: ["4", "5", "6", "7"],
        correctAnswer: "5",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "What is the opposite of 'hot'?",
        options: ["Cold", "Warm", "Cool", "Dry"],
        correctAnswer: "Cold",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "Which word is a fruit?",
        options: ["Car", "Apple", "Dog", "Book"],
        correctAnswer: "Apple",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "What animal says 'woof'?",
        options: ["Cat", "Dog", "Bird", "Fish"],
        correctAnswer: "Dog",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "Which word means 'fast'?",
        options: ["Slow", "Quick", "Lazy", "Tired"],
        correctAnswer: "Quick",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "How many letters are in 'cat'?",
        options: ["2", "3", "4", "5"],
        correctAnswer: "3",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "What is the opposite of 'new'?",
        options: ["Old", "Young", "Fresh", "Clean"],
        correctAnswer: "Old",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "Which word is a vegetable?",
        options: ["Pizza", "Carrot", "Cake", "Bread"],
        correctAnswer: "Carrot",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "What animal says 'quack'?",
        options: ["Dog", "Cat", "Duck", "Pig"],
        correctAnswer: "Duck",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "Which word means 'small'?",
        options: ["Big", "Huge", "Tiny", "Large"],
        correctAnswer: "Tiny",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "How many letters are in 'dog'?",
        options: ["2", "3", "4", "5"],
        correctAnswer: "3",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "What is the opposite of 'wet'?",
        options: ["Dry", "Wet", "Cold", "Hot"],
        correctAnswer: "Dry",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "Which word is a furniture?",
        options: ["Chair", "Car", "Ball", "Book"],
        correctAnswer: "Chair",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "What animal says 'moo'?",
        options: ["Cat", "Dog", "Cow", "Pig"],
        correctAnswer: "Cow",
        difficulty: 'easy',
        category: 'english'
      },
      {
        question: "What is the past tense of 'run'?",
        options: ["Runned", "Running", "Ran", "Runs"],
        correctAnswer: "Ran",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "Which is a noun?",
        options: ["Quickly", "Happy", "Table", "Beautifully"],
        correctAnswer: "Table",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "What does 'enormous' mean?",
        options: ["Small", "Tiny", "Very big", "Medium"],
        correctAnswer: "Very big",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "Which sentence is correct?",
        options: ["He go to school", "He goes to school", "He going to school", "He gone to school"],
        correctAnswer: "He goes to school",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "What is a synonym for 'beautiful'?",
        options: ["Ugly", "Pretty", "Scary", "Boring"],
        correctAnswer: "Pretty",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "Which word is a verb?",
        options: ["Happiness", "Run", "Table", "Quickly"],
        correctAnswer: "Run",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "What does 'curious' mean?",
        options: ["Uninterested", "Wanting to learn", "Angry", "Sad"],
        correctAnswer: "Wanting to learn",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "Which sentence uses the correct verb?",
        options: ["She eat breakfast", "She eats breakfast", "She eating breakfast", "She ate breakfast"],
        correctAnswer: "She eats breakfast",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "What is an antonym for 'happy'?",
        options: ["Sad", "Joyful", "Excited", "Glad"],
        correctAnswer: "Sad",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "Which word is an adjective?",
        options: ["Quickly", "Beautiful", "Beauty", "Run"],
        correctAnswer: "Beautiful",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "What does 'generous' mean?",
        options: ["Selfish", "Kind", "Mean", "Angry"],
        correctAnswer: "Kind",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "Which sentence is correct?",
        options: ["They has many friends", "They have many friends", "They having many friends", "They had many friends"],
        correctAnswer: "They have many friends",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "What is a synonym for 'fast'?",
        options: ["Slow", "Quick", "Rapid", "Tired"],
        correctAnswer: "Rapid",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "Which word is a preposition?",
        options: ["Under", "Table", "Happy", "Run"],
        correctAnswer: "Under",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "What does 'brave' mean?",
        options: ["Scared", "Courageous", "Fearful", "Afraid"],
        correctAnswer: "Courageous",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "Which sentence uses correct grammar?",
        options: ["The boy run fast", "The boy runs fast", "The boy running fast", "The boy ran fast"],
        correctAnswer: "The boy runs fast",
        difficulty: 'medium',
        category: 'english'
      },
      {
        question: "What is the plural of 'child'?",
        options: ["Childs", "Children", "Childes", "Childrens"],
        correctAnswer: "Children",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "Which word is an adverb?",
        options: ["Quick", "Quickly", "Quickness", "Quicken"],
        correctAnswer: "Quickly",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "What does 'benevolent' mean?",
        options: ["Evil", "Kind and generous", "Scary", "Confused"],
        correctAnswer: "Kind and generous",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "Which sentence uses the correct tense?",
        options: ["I have seen him yesterday", "I saw him yesterday", "I see him yesterday", "I had seen him yesterday"],
        correctAnswer: "I saw him yesterday",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "What is the antonym of 'ancient'?",
        options: ["Old", "Modern", "Historic", "Vintage"],
        correctAnswer: "Modern",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "Which word is a conjunction?",
        options: ["And", "Table", "Happy", "Run"],
        correctAnswer: "And",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "What does 'meticulous' mean?",
        options: ["Careless", "Very careful", "Fast", "Lazy"],
        correctAnswer: "Very careful",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "Which sentence is grammatically correct?",
        options: ["Neither of the options is correct", "Neither of the options are correct", "Neither of the option is correct", "Neither of the options was correct"],
        correctAnswer: "Neither of the options is correct",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "What is a synonym for 'intelligent'?",
        options: ["Stupid", "Smart", "Clever", "Bright"],
        correctAnswer: "Smart",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "Which word is a pronoun?",
        options: ["They", "Running", "Beautiful", "Quickly"],
        correctAnswer: "They",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "What does 'ubiquitous' mean?",
        options: ["Rare", "Everywhere", "Fast", "Slow"],
        correctAnswer: "Everywhere",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "Which sentence uses correct subject-verb agreement?",
        options: ["The group of students are studying", "The group of students is studying", "The group of students studying", "The group of students studied"],
        correctAnswer: "The group of students is studying",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "What is the antonym of 'optimistic'?",
        options: ["Pessimistic", "Hopeful", "Happy", "Excited"],
        correctAnswer: "Pessimistic",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "Which word is an interjection?",
        options: ["Wow", "Table", "Running", "Beautiful"],
        correctAnswer: "Wow",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "What does 'eloquent' mean?",
        options: ["Speechless", "Fluent", "Slow", "Quiet"],
        correctAnswer: "Fluent",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "Which sentence is grammatically correct?",
        options: ["Each of the girls have a book", "Each of the girls has a book", "Each of the girls having a book", "Each of the girls had a book"],
        correctAnswer: "Each of the girls has a book",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "What is a synonym for ' diligent'?",
        options: ["Lazy", "Hardworking", "Tired", "Careless"],
        correctAnswer: "Hardworking",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "Which word is a proper noun?",
        options: ["City", "Paris", "Beautiful", "Run"],
        correctAnswer: "Paris",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "What does 'procrastinate' mean?",
        options: ["Do immediately", "Delay doing", "Do quickly", "Finish"],
        correctAnswer: "Delay doing",
        difficulty: 'hard',
        category: 'english'
      },
      {
        question: "Which sentence uses correct punctuation?",
        options: ["The boy said; hello", "The boy said, hello", "The boy said hello", "The boy said 'hello'"],
        correctAnswer: "The boy said, hello",
        difficulty: 'hard',
        category: 'english'
      },
      // Tricky Games questions (17 easy, 16 medium, 18 hard)
      {
        question: "What has keys but can't open locks?",
        options: ["Door", "Piano", "Car", "House"],
        correctAnswer: "Piano",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What goes up but never comes down?",
        options: ["Ball", "Age", "Rain", "Bird"],
        correctAnswer: "Age",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has hands but can't clap?",
        options: ["Gloves", "Clock", "Person", "Robot"],
        correctAnswer: "Clock",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What gets wet while drying?",
        options: ["Towel", "Clothes", "Hair", "Paper"],
        correctAnswer: "Towel",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has a neck but no head?",
        options: ["Giraffe", "Shirt", "Bottle", "Snake"],
        correctAnswer: "Bottle",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has legs but cannot walk?",
        options: ["Table", "Person", "Dog", "Bird"],
        correctAnswer: "Table",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has a face and two hands but no arms?",
        options: ["Clock", "Person", "Robot", "Tree"],
        correctAnswer: "Clock",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What can travel around the world while staying in a corner?",
        options: ["Airplane", "Stamp", "Bird", "Cloud"],
        correctAnswer: "Stamp",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has teeth but cannot bite?",
        options: ["Dog", "Comb", "Shark", "Alligator"],
        correctAnswer: "Comb",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What is full of holes but still holds water?",
        options: ["Bucket", "Sponge", "Net", "Strainer"],
        correctAnswer: "Sponge",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has a ring but no finger?",
        options: ["Phone", "Person", "Bell", "Clock"],
        correctAnswer: "Phone",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has eyes but cannot see?",
        options: ["Needle", "Person", "Potato", "Camera"],
        correctAnswer: "Potato",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has a bed but never sleeps?",
        options: ["Person", "River", "Bed", "Ocean"],
        correctAnswer: "River",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has a mouth but never speaks?",
        options: ["Person", "River", "Cave", "Bird"],
        correctAnswer: "River",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has a tongue but cannot taste?",
        options: ["Person", "Shoe", "Bell", "Boot"],
        correctAnswer: "Shoe",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has wings but cannot fly?",
        options: ["Bird", "Airplane", "Penguin", "Butterfly"],
        correctAnswer: "Penguin",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has leaves but no branches?",
        options: ["Tree", "Book", "Table", "Chair"],
        correctAnswer: "Book",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "What has a spine but no bones?",
        options: ["Person", "Book", "Ladder", "Snake"],
        correctAnswer: "Book",
        difficulty: 'easy',
        category: 'tricky'
      },
      {
        question: "The more you take, the more you leave behind. What is it?",
        options: ["Money", "Footsteps", "Time", "Food"],
        correctAnswer: "Footsteps",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What word is pronounced the same if you take away the first, last, or middle letter?",
        options: ["Empty", "Banana", "Clean", "Level"],
        correctAnswer: "Empty",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What can you catch but not throw?",
        options: ["Ball", "Cold", "Water", "Fish"],
        correctAnswer: "Cold",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What can you keep even after giving it to someone?",
        options: ["Money", "Promise", "Gift", "Ball"],
        correctAnswer: "Promise",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What belongs to you but others use it more?",
        options: ["Money", "Name", "Phone", "Car"],
        correctAnswer: "Name",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What gets bigger the more you take away?",
        options: ["Hole", "Pile", "Mountain", "Wall"],
        correctAnswer: "Hole",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What is always coming but never arrives?",
        options: ["Tomorrow", "Yesterday", "Today", "Now"],
        correctAnswer: "Tomorrow",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What has a head and a tail but no body?",
        options: ["Coin", "Person", "Dog", "Cat"],
        correctAnswer: "Coin",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What can fill a room but takes up no space?",
        options: ["Air", "Light", "Sound", "Ghost"],
        correctAnswer: "Light",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What has cities, but no houses; mountains, but no trees; and water, but no fish?",
        options: ["Map", "Picture", "Book", "Dream"],
        correctAnswer: "Map",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What can you break even if you never name it?",
        options: ["Promise", "Glass", "Rule", "Law"],
        correctAnswer: "Promise",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What goes up when the rain comes down?",
        options: ["Umbrella", "Mud", "Sun", "Bird"],
        correctAnswer: "Umbrella",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What has a bark but no bite?",
        options: ["Dog", "Tree", "Person", "Wolf"],
        correctAnswer: "Tree",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What is always in front of you but can't be seen?",
        options: ["Future", "Past", "Present", "Yesterday"],
        correctAnswer: "Future",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "What can you hold in your right hand but never in your left?",
        options: ["Your left hand", "Your right hand", "A pen", "A phone"],
        correctAnswer: "Your left hand",
        difficulty: 'medium',
        category: 'tricky'
      },
      {
        question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        options: ["Ghost", "Echo", "Wind", "Whisper"],
        correctAnswer: "Echo",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "The more of this there is, the less you see. What is it?",
        options: ["Light", "Darkness", "Fog", "Water"],
        correctAnswer: "Darkness",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What begins with T, ends with T, and has T in it?",
        options: ["Tent", "Teapot", "Toast", "Teeth"],
        correctAnswer: "Teapot",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What is broken when you name it?",
        options: ["Silence", "Glass", "Wall", "Door"],
        correctAnswer: "Silence",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What can you find in the middle of nowhere?",
        options: ["Nowhere", "Here", "There", "Somewhere"],
        correctAnswer: "Nowhere",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What can you give away and still keep?",
        options: ["Secret", "Money", "Gift", "Advice"],
        correctAnswer: "Secret",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What looks like a half-moon but never gets full?",
        options: ["Letter C", "Letter D", "Letter O", "Letter U"],
        correctAnswer: "Letter C",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What gets wetter the more it dries?",
        options: ["Towel", "Clothes", "Paper", "Sponge"],
        correctAnswer: "Towel",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What can you only hold while it's broken?",
        options: ["Promise", "Egg", "Glass", "Record"],
        correctAnswer: "Promise",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What is made of water but if you put it in water it will die?",
        options: ["Ice", "Fire", "Paper", "Wood"],
        correctAnswer: "Ice",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What has a bottom at the top?",
        options: ["Leg", "Ladder", "Table", "Chair"],
        correctAnswer: "Leg",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
        options: ["Letter M", "Letter S", "Letter T", "Letter A"],
        correctAnswer: "Letter M",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What can you hear but not see, and you can see but not hear?",
        options: ["Voice and picture", "Sound and sight", "Wind and rain", "Fire and ice"],
        correctAnswer: "Voice and picture",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What is always coming but never arrives?",
        options: ["Tomorrow", "Yesterday", "Today", "Never"],
        correctAnswer: "Tomorrow",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What has no locks but has keys?",
        options: ["Piano", "Map", "Computer", "Keyboard"],
        correctAnswer: "Keyboard",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What can you serve but not eat?",
        options: ["Tennis ball", "Cake", "Pizza", "Bread"],
        correctAnswer: "Tennis ball",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What gets sharper the more you use it?",
        options: ["Knife", "Pencil", "Paper", "Scissors"],
        correctAnswer: "Brain",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What has no weight but can be seen by the naked eye?",
        options: ["Shadow", "Light", "Wind", "Fire"],
        correctAnswer: "Shadow",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What can you make but not see?",
        options: ["Sound", "Picture", "Video", "Movie"],
        correctAnswer: "Sound",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What is always in debt but never owes?",
        options: ["Money", "Credit", "Debit", "Cash"],
        correctAnswer: "Debit",
        difficulty: 'hard',
        category: 'tricky'
      },
      {
        question: "What has a neck but no head, a body but no arms, and runs but never walks?",
        options: ["Shirt", "Person", "Robot", "Mannequin"],
        correctAnswer: "Shirt",
        difficulty: 'hard',
        category: 'tricky'
      },
      // Science questions (17 easy, 16 medium, 18 hard)
      {
        question: "What do plants need to grow?",
        options: ["Candy", "Sunlight and water", "Toys", "Video games"],
        correctAnswer: "Sunlight and water",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "Which animal lives in water?",
        options: ["Cat", "Dog", "Fish", "Bird"],
        correctAnswer: "Fish",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What is the sky color during the day?",
        options: ["Red", "Blue", "Green", "Purple"],
        correctAnswer: "Blue",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What do we use to see?",
        options: ["Ears", "Nose", "Eyes", "Mouth"],
        correctAnswer: "Eyes",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "Which season is the hottest?",
        options: ["Winter", "Spring", "Summer", "Fall"],
        correctAnswer: "Summer",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What do we breathe?",
        options: ["Water", "Air", "Food", "Soil"],
        correctAnswer: "Air",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "Which animal says 'moo'?",
        options: ["Cat", "Dog", "Cow", "Pig"],
        correctAnswer: "Cow",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What gives us light at night?",
        options: ["Sun", "Moon", "Stars", "Clouds"],
        correctAnswer: "Moon",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What do we use to hear?",
        options: ["Eyes", "Nose", "Ears", "Mouth"],
        correctAnswer: "Ears",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What do birds have?",
        options: ["Fins", "Wings", "Gills", "Scales"],
        correctAnswer: "Wings",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What do fish have?",
        options: ["Wings", "Legs", "Fins", "Arms"],
        correctAnswer: "Fins",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What do we use to smell?",
        options: ["Eyes", "Ears", "Nose", "Mouth"],
        correctAnswer: "Nose",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What do we use to eat?",
        options: ["Eyes", "Ears", "Nose", "Mouth"],
        correctAnswer: "Mouth",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What season is coldest?",
        options: ["Summer", "Spring", "Fall", "Winter"],
        correctAnswer: "Winter",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What do we use to walk?",
        options: ["Hands", "Feet", "Head", "Back"],
        correctAnswer: "Feet",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What do we use to hold things?",
        options: ["Feet", "Hands", "Head", "Back"],
        correctAnswer: "Hands",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What do we use to think?",
        options: ["Heart", "Lungs", "Brain", "Stomach"],
        correctAnswer: "Brain",
        difficulty: 'easy',
        category: 'science'
      },
      {
        question: "What planet do we live on?",
        options: ["Mars", "Venus", "Earth", "Jupiter"],
        correctAnswer: "Earth",
        difficulty: 'medium',
        category: 'science'
      },
      {
        question: "What do bees make?",
        options: ["Milk", "Honey", "Cheese", "Bread"],
        correctAnswer: "Honey",
        difficulty: 'medium',
        category: 'science'
      },
      {
        question: "Which one is a mammal?",
        options: ["Fish", "Bird", "Snake", "Dog"],
        correctAnswer: "Dog",
        difficulty: 'medium',
        category: 'science'
      },
      {
        question: "What causes the moon to change shape?",
        options: ["Clouds", "Sunlight", "Earth's shadow", "Stars"],
        correctAnswer: "Sunlight",
        difficulty: 'medium',
        category: 'science'
      },
      {
        question: "What do roots do for plants?",
        options: ["Make flowers", "Absorb water and nutrients", "Catch sunlight", "Grow leaves"],
        correctAnswer: "Absorb water and nutrients",
        difficulty: 'medium',
        category: 'science'
      },
      {
        question: "What do leaves do for plants?",
        options: ["Absorb water", "Catch sunlight", "Grow roots", "Make fruit"],
        correctAnswer: "Catch sunlight",
        difficulty: 'medium',
        category: 'science'
      },
      {
        question: "What do flowers do for plants?",
        options: ["Absorb water", "Catch sunlight", "Make seeds", "Grow roots"],
        correctAnswer: "Make seeds",
        difficulty: 'medium',
        category: 'science'
      },
      {
        question: "What do stems do for plants?",
        options: ["Absorb water", "Support the plant", "Catch sunlight", "Make seeds"],
        correctAnswer: "Support the plant",
        difficulty: 'medium',
        category: 'science'
      },
      {
        question: "What do humans need to survive?",
        options: ["Video games", "Food, water, air", "Toys", "Clothes"],
        correctAnswer: "Food, water, air",
        difficulty: 'medium',
        category: 'science'
      },
      {
        question: "What do animals need to survive?",
        options: ["Money", "Food, water, shelter", "Cars", "Houses"],
        correctAnswer: "Food, water, shelter",
        difficulty: 'medium',
        category: 'science'
      },
      {
        question: "What is the largest planet in our solar system?",
        options: ["Earth", "Mars", "Jupiter", "Saturn"],
        correctAnswer: "Jupiter",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What process do plants use to make food?",
        options: ["Eating", "Photosynthesis", "Drinking", "Sleeping"],
        correctAnswer: "Photosynthesis",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What is the center of our solar system?",
        options: ["Earth", "Moon", "Sun", "Mars"],
        correctAnswer: "Sun",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "Which animal lays eggs?",
        options: ["Dog", "Cat", "Chicken", "Cow"],
        correctAnswer: "Chicken",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What is the water cycle?",
        options: ["Water disappearing", "Water moving from earth to sky and back", "Water staying still", "Water turning into ice only"],
        correctAnswer: "Water moving from earth to sky and back",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What is the largest animal on Earth?",
        options: ["Elephant", "Blue whale", "Giraffe", "Lion"],
        correctAnswer: "Blue whale",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What is the smallest planet in our solar system?",
        options: ["Mercury", "Venus", "Earth", "Mars"],
        correctAnswer: "Mercury",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What gives us energy?",
        options: ["Water", "Food", "Air", "Soil"],
        correctAnswer: "Food",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What do we get from plants?",
        options: ["Electricity", "Food, oxygen, medicine", "Plastic", "Metal"],
        correctAnswer: "Food, oxygen, medicine",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What is gravity?",
        options: ["A type of plant", "Force that pulls objects down", "A type of animal", "A type of food"],
        correctAnswer: "Force that pulls objects down",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What are the three states of matter?",
        options: ["Hot, warm, cold", "Solid, liquid, gas", "Big, medium, small", "Fast, medium, slow"],
        correctAnswer: "Solid, liquid, gas",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What is the Earth made of?",
        options: ["Glass", "Rock, water, air", "Plastic", "Metal"],
        correctAnswer: "Rock, water, air",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What is the largest ocean?",
        options: ["Atlantic", "Indian", "Pacific", "Arctic"],
        correctAnswer: "Pacific",
        difficulty: 'hard',
        category: 'science'
      },
      {
        question: "What is the highest mountain?",
        options: ["Mount Fuji", "Mount Everest", "Mount Kilimanjaro", "Mount McKinley"],
        correctAnswer: "Mount Everest",
        difficulty: 'hard',
        category: 'science'
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
