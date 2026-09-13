import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import HomeScreen from "./pages/HomeScreen";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ChildDashboard from "./pages/ChildDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import TherapistDashboard from "./pages/TherapistDashboard";
import MathQuizGame from "./pages/MathQuizGame";
import QuizGame from "./pages/QuizGame";
import LevelSelection from "./pages/LevelSelection";
import ColorGame from "./pages/ColorGame";
import PuzzleGame from "./pages/PuzzleGame";
import EnglishQuizGame from "./pages/EnglishQuizGame";
import EnglishLevelSelection from "./pages/EnglishLevelSelection";
import ScienceQuizGame from "./pages/ScienceQuizGame";
import ScienceLevelSelection from "./pages/ScienceLevelSelection";
import TrickyGames from "./pages/TrickyGames";
import TrickyLevelSelection from "./pages/TrickyLevelSelection";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/child-dashboard" element={<ChildDashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/therapist-dashboard" element={<TherapistDashboard />} />
        <Route path="/teacher-dashboard" element={<TherapistDashboard />} />
        <Route path="/math-quiz" element={<Navigate to="/math-quiz-levels" />} />
        <Route path="/math-quiz-levels" element={<LevelSelection />} />
        <Route path="/math-quiz/level/:level" element={<MathQuizGame className="app-container" />} />
        <Route path="/quiz-game" element={<QuizGame className="app-container" />} />
        <Route path="/color-game" element={<ColorGame />} />
        <Route path="/puzzle-game" element={<PuzzleGame />} />
        <Route path="/english-quiz" element={<Navigate to="/english-quiz-levels" />} />
        <Route path="/english-quiz-levels" element={<EnglishLevelSelection />} />
        <Route path="/english-quiz/level/:level" element={<EnglishQuizGame />} />
        <Route path="/science-quiz" element={<Navigate to="/science-quiz-levels" />} />
        <Route path="/science-quiz-levels" element={<ScienceLevelSelection />} />
        <Route path="/science-quiz/level/:level" element={<ScienceQuizGame />} />
        <Route path="/tricky-games" element={<Navigate to="/tricky-games-levels" />} />
        <Route path="/tricky-games-levels" element={<TrickyLevelSelection />} />
        <Route path="/tricky-games/level/:level" element={<TrickyGames />} />

      </Routes>
    </Router>
  );
}
export default App;
