const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question_number: Number,
  subject: String,
  game: String,
  difficulty: String,
  question: String,
  image_url: String,
  options: [String],
  answer: String,
  level: String
});

module.exports = mongoose.model('Question', questionSchema);
