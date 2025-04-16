const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    enum: ['color', 'puzzle'],
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
