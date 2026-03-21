const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.gameType === 'math';
    }
  },
  userName: {
    type: String,
    required: true
  },
  childName: {
    type: String,
    required: function() {
      return this.gameType === 'math';
    }
  },
  gameType: {
    type: String,
    enum: ['color', 'puzzle', 'math'],
    required: true
  },
  score: {
    type: Number,
    required: function() {
      return this.gameType === 'color';
    }
  },
  level: {
    type: Number,
    required: function() {
      return this.gameType === 'color';
    }
  },
  moves: {
    type: Number,
    required: function() {
      return this.gameType === 'puzzle';
    }
  },
  timeElapsed: {
    type: Number,
    required: function() {
      return this.gameType === 'puzzle';
    }
  },
  date: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('GameResult', gameResultSchema);
