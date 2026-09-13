require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");
const questionRoutes = require("./routes/questionRoutes");
const expressionRoutes = require("./routes/expressionRoutes");
const quizResultRoutes = require("./routes/quizResultRoutes");
const therapistRoutes = require("./routes/therapistRoutes");
const userListRoutes = require("./routes/userListRoutes");
const userRoutes = require("./routes/userRoutes");
const gameProgressRoutes = require("./routes/gameProgressRoutes");
const axios = require("axios"); // For calling Flask API

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect("mongodb://127.0.0.1:27017/mern_auth", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes for authentication, game logic, and questions
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/expressions", expressionRoutes);
app.use("/api/quiz-results", quizResultRoutes);
app.use("/api/therapist", therapistRoutes);
app.use("/api/users", userListRoutes);
app.use("/api/users", userRoutes);
app.use("/api/game-progress", gameProgressRoutes);

// New Route to get the predicted learning path from Flask
app.get("/api/predict-path", async (req, res) => {
  try {
    // Call Flask API to get the predicted learning path based on facial expressions
    const response = await axios.get("http://localhost:5001/api/predict-path");
    // Forward the response to the client
    res.json({
      predicted_path: response.data.predicted_path,
      expression_probs: response.data.expression_probs,
    });
  } catch (error) {
    console.error("❌ Error fetching prediction:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch predicted path from Flask" });
  }
});

// Start Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
