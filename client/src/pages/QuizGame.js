import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "../styles/QuizGame.css";

const GAME_NAME = "Quiz Master"; // You can change this game name as needed
const LEVELS = 5;

function QuizGame() {
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/questions?game=${GAME_NAME}&level=${level}`)
      .then(res => {
        console.log('Fetched questions:', res.data); // Debug log
        setQuestions(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load questions');
        setLoading(false);
        console.error('Error fetching questions:', err); // Debug log
      });
  }, [level]);

  const handleNextLevel = () => {
    if (level < LEVELS) setLevel(level + 1);
  };
  const handlePrevLevel = () => {
    if (level > 1) setLevel(level - 1);
  };

  return (
    <div className="quiz-game-container">
      <h2>{GAME_NAME} - Level {level}</h2>
      <button onClick={handlePrevLevel} disabled={level === 1}>Previous Level</button>
      <button onClick={handleNextLevel} disabled={level === LEVELS}>Next Level</button>
      {loading && <p>Loading questions...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {questions.length === 0 && !loading && <p>No questions found for this level.</p>}
      {questions.map(q => (
        <div key={q._id || q.question_number} className="question-card">
          <p><b>Q{q.question_number}:</b> {q.question}</p>
          {q.image_url && q.image_url !== '' && (
            <img src={q.image_url} alt="Question visual" style={{maxWidth:'200px'}} />
          )}
          <ul>
            {q.options.map(opt => (
              <li key={opt}>{opt}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default QuizGame;
