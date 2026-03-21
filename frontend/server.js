require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");
const questionRoutes = require("./routes/questionRoutes");
const axios = require("axios"); // For calling Flask API
const expressionSessionManager = require("./expressionSessionManager");

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

// Start expression tracking session
app.post("/api/expressions/start", (req, res) => {
  const result = expressionSessionManager.startSession();
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// Stop expression tracking session
app.post("/api/expressions/stop", async (req, res) => {
  const result = await expressionSessionManager.stopSession();
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// Start Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
