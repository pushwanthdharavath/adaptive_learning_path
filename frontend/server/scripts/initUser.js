const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/mathquiz', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("u2705 MongoDB Connected"))
  .catch((err) => console.error("u274c MongoDB Connection Error:", err));

// Sample user data
const sampleUsers = [
  {
    name: 'Test Parent',
    age: 35,
    gender: 'Male',
    email: 'parent@test.com',
    password: 'password123',
    role: 'parent',
    parentCode: 'parent0001',
    isVerified: true
  },
  {
    name: 'Test Child',
    age: 10,
    gender: 'Female',
    email: 'child@test.com',
    password: 'password123',
    role: 'child',
    isVerified: true
    // parentId will be set after parent is created
  }
];

async function initUsers() {
  try {
    // Check if users already exist
    const existingUsers = await User.find({});
    console.log(`Found ${existingUsers.length} existing users`);
    
    if (existingUsers.length > 0) {
      console.log('Users already exist in database. Here are the existing users:');
      existingUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}), Role: ${user.role}`);
      });
      
      // Exit process
      mongoose.disconnect();
      return;
    }
    
    // Create parent user first
    const parentUser = new User(sampleUsers[0]);
    await parentUser.save();
    console.log(`Created parent user: ${parentUser.name} (${parentUser.email})`);
    
    // Set parentId for child user and save
    sampleUsers[1].parentId = parentUser._id;
    const childUser = new User(sampleUsers[1]);
    await childUser.save();
    console.log(`Created child user: ${childUser.name} (${childUser.email})`);
    
    console.log('Sample users created successfully!');
    console.log('Login credentials:');
    console.log('Parent: email=parent@test.com, password=password123');
    console.log('Child: email=child@test.com, password=password123');
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error('Error initializing users:', error);
    mongoose.disconnect();
  }
}

// Run the initialization function
initUsers();
