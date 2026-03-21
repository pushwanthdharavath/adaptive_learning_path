require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

// Create Express app
const app = express();

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/quizdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define User Schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

// Define Question Schema
const QuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: String
});

const Question = mongoose.model('Question', QuestionSchema);

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
  console.log('🔍 [DEBUG] Signup request:', req.body);
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide username, email and password' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password, // In a real app, hash the password
      role: 'student'
    });
    
    await newUser.save();
    
    // Create token (simplified for testing)
    const token = username + Date.now();
    
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('❌ Error during signup:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  console.log('🔍 [DEBUG] Login request:', req.body);
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password (simplified for testing)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create token (simplified for testing)
    const token = user.username + Date.now();
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Error during login:', err);
    res.status(500).json({ error: err.message });
  }
});

// Question Route
app.get('/api/questions', async (req, res) => {
  console.log('🔍 [DEBUG] Received request for questions with params:', req.query);
  try {
    const { level, emotion } = req.query;
    let difficulty = 'easy';
    
    if (level === '1') {
      difficulty = 'easy';
    } else if (emotion === 'happy' || emotion === 'neutral') {
      difficulty = 'medium';
    } else if (emotion === 'confused' || emotion === 'frustrated') {
      difficulty = 'easy';
    } else {
      difficulty = 'medium'; // Default
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

// Expression Routes
app.post('/api/expressions/start-tracking', async (req, res) => {
  console.log('🔍 [DEBUG] Received request to start tracking');
  try {
    const flaskApi = axios.create({
      baseURL: 'http://127.0.0.1:5001',
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const response = await flaskApi.post('/api/expressions/start-tracking');
    console.log('✅ Started tracking:', response.data);
    res.json(response.data);
  } catch (err) {
    console.error('❌ Error starting tracking:', err.message);
    // Return a success response even if Flask fails
    res.json({ status: 'tracking started (simulated)' });
  }
});

app.post('/api/expressions/stop-tracking', async (req, res) => {
  console.log('🔍 [DEBUG] Received request to stop tracking');
  try {
    const flaskApi = axios.create({
      baseURL: 'http://127.0.0.1:5001',
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const response = await flaskApi.post('/api/expressions/stop-tracking', req.body);
    console.log('✅ Stopped tracking:', response.data);
    res.json(response.data);
  } catch (err) {
    console.error('❌ Error stopping tracking:', err.message);
    // Return a simulated response if Flask fails
    res.json({
      final_expression: 'neutral',
      difficulty: 'medium',
      questions: []
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- GET  /api/test');
  console.log('- POST /api/auth/signup');
  console.log('- POST /api/auth/login');
  console.log('- GET  /api/questions');
  console.log('- POST /api/expressions/start-tracking');
  console.log('- POST /api/expressions/stop-tracking');
});
