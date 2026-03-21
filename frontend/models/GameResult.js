const mongoose = require("mongoose");

const GameResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: {
    type: String,
    default: 'Student'
  },
  gameType: {
    type: String,
    enum: ["puzzle", "color"],
    required: true
  },
  result: {
    type: String,
    enum: ["win", "lose"],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("GameResult", GameResultSchema); 