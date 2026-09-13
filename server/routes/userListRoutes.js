const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Route to get all users with basic information
router.get('/all', async (req, res) => {
  try {
    console.log('Fetching all users from database');
    const users = await User.find().select('name age role email');
    console.log(`Found ${users.length} users in the database`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Route to get users by role
router.get('/by-role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    console.log(`Fetching users with role: ${role}`);
    const users = await User.find({ role }).select('name age email');
    console.log(`Found ${users.length} users with role ${role}`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;
