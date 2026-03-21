// This script creates a test math quiz result record
const mongoose = require('mongoose');
const MathQuizResult = require('./models/MathQuizResult');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mathquiz', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected for test data insertion'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample data for Alex Johnson (using the ID from the fallback data)
const createTestData = async () => {
  try {
    // Delete any existing test data for this child
    await MathQuizResult.deleteMany({ childName: 'Alex Johnson' });
    
    // Create new test records
    const testData = [
      {
        childName: 'Alex Johnson',
        parentId: '507f1f77bcf86cd799439011', // This is the ID from your fallback data
        easyLevelScore: 85,
        mediumLevelScore: 70,
        hardLevelScore: 55,
        totalScore: 210,
        completedAt: new Date()
      },
      {
        childName: 'Alex Johnson',
        parentId: '507f1f77bcf86cd799439011',
        easyLevelScore: 90,
        mediumLevelScore: 75,
        hardLevelScore: 60,
        totalScore: 225,
        completedAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        childName: 'Alex Johnson',
        parentId: '507f1f77bcf86cd799439011',
        easyLevelScore: 95,
        mediumLevelScore: 80,
        hardLevelScore: 65,
        totalScore: 240,
        completedAt: new Date(Date.now() - 172800000) // 2 days ago
      }
    ];
    
    const results = await MathQuizResult.insertMany(testData);
    console.log(`✅ Created ${results.length} test math quiz results`);
    console.log(results);
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    mongoose.connection.close();
  }
};

// Run the function
createTestData();
