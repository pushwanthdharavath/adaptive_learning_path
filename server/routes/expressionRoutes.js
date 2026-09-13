const express = require('express');
const router = express.Router();
const axios = require('axios');

console.log('🔍 Loading expressionRoutes.js...');

// Test route - should be accessible at /api/expressions/test
router.get('/test', (req, res) => {
  console.log('Expression test route called!');
  res.json({ message: 'Expression routes are working!' });
});

// Configure axios for Flask API
const flaskApi = axios.create({
  baseURL: 'http://127.0.0.1:5001',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Start expression tracking (calls Flask)
router.post('/start-tracking', async (req, res) => {
  console.log('🔍 [DEBUG] Received request at /api/expressions/start-tracking');
  console.log('Received start-tracking request');
  try {
    console.log('🔑 Forwarding start-tracking request to Flask');
    
    // Send empty JSON body to avoid 400 errors
    const response = await flaskApi.post('/api/expressions/start-tracking', {});
    console.log('✅ Flask response:', response.data);
    res.json(response.data);
  } catch (err) {
    console.error('Error starting tracking:', {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message
    });
    
    // Return a fallback successful response even if Flask server fails
    console.log('⚠️ Camera access issue detected. Returning fallback response.');
    res.json({
      status: 'success',
      message: 'Tracking started (fallback mode)',
      fallbackMode: true
    });
  }
});

// Stop expression tracking (calls Flask)
router.post('/stop-tracking', async (req, res) => {
  console.log('🔍 [DEBUG] Received request at /api/expressions/stop-tracking');
  console.log('Received stop-tracking request');
  try {
    console.log('📍 Forwarding stop-tracking request to Flask');
    const response = await flaskApi.post('/api/expressions/stop-tracking', req.body);
    res.json(response.data);
  } catch (err) {
    console.error('Error stopping tracking:', {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message
    });
    
    // Return a fallback expression result if Flask server fails
    console.log('⚠️ Camera access issue detected. Returning fallback expression data.');
    
    // Extract level and score from request if available
    const { level = 1, score = 80 } = req.body;
    const difficulty = level <= 1 ? 'easy' : level <= 2 ? 'medium' : 'hard';
    
    // Return fallback data that mimics successful tracking
    res.json({
      expression: 'neutral',  // Default neutral expression
      difficulty: difficulty,
      expressionConfidence: 0.85,
      score: score,
      level: level,
      fallbackMode: true,
      message: 'Expression tracking completed (fallback mode)'
    });
  }
});


// Log path for a level
router.post('/log-path', (req, res) => {
  const { path, level } = req.body;
  console.log(`Path for Level ${level}:`, path);
  res.json({ status: 'logged' });
});

// Image analysis endpoint - passes webcam images to Flask for processing
router.post('/analyze', async (req, res) => {
  console.log('🔍 Received expression analysis request');
  
  try {
    // Simply forward the request as-is to Flask
    const response = await flaskApi.post('/api/expressions/analyze', req.body, {
      headers: {
        'Content-Type': req.headers['content-type']
      }
    });
    
    console.log('✅ Flask analysis successful');
    res.json(response.data);
  } catch (err) {
    console.error('⚠️ Camera or Flask error:', err.message);
    
    // Check if the error is related to camera access
    if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout') || 
        err.message.includes('camera') || err.message.includes('frame')) {
      console.log('⚠️ Camera access issue detected. Returning fallback expression data.');
    }
    
    // Return a more comprehensive fallback response
    res.json({
      expression: 'neutral',
      expressionName: 'Neutral',
      confidence: 0.85,
      fallbackMode: true,
      message: 'Using fallback expression data due to camera access issues',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
