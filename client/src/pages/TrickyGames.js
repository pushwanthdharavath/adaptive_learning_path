import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import WebcamCapture from '../components/common/WebcamCapture';
import '../styles/MathQuizStyles.css';
import api from '../api';

const LEVELS = 5;
const QUESTIONS_PER_LEVEL = 5;

// Helper functions for emotion display
const getFinalEmotionColor = (emotion) => {
  if (!emotion) return '#666';
  
  switch(emotion) {
    case 'happy':
    case 'surprised':
      return '#4caf50';
    case 'neutral':
    case 'focused':
      return '#2196f3';
    case 'sad':
    case 'angry':
    case 'confused':
      return '#f44336';
    default:
      return '#666';
  }
};

const getFinalEmotionMessage = (emotion) => {
  if (!emotion) return 'No expression detected';

  switch(emotion) {
    case 'happy':
      return 'You seemed happy with the challenge! Next level will be harder.';
    case 'neutral':
      return 'You remained neutral. Next level will be medium difficulty';
    case 'focused':
      return 'Great focus! We\'ll keep the challenge at medium difficulty';
    case 'angry':
      return 'You looked stressed. We\'ll make the next level easier';
    case 'confused':
      return 'You seemed confused. Next level will be easier to help you learn';
    default:
      return 'We\'ll adjust the difficulty based on your expression';
  }
};

const getDifficultyFromEmotion = (emotion, score) => {
  if (!emotion) return 'medium';

  const totalPossibleScore = QUESTIONS_PER_LEVEL * 20;
  const scorePercentage = (score / totalPossibleScore) * 100;

  console.log(`🎯 Difficulty calculation: Score ${score} (${scorePercentage.toFixed(1)}%), Expression: ${emotion}`);

  // If score is very low (< 40%), always give easy questions
  if (scorePercentage < 40) {
    console.log('→ Low score: Choosing EASY questions');
    return 'easy';
  }

  // If score is medium (40-70%), give mixed easy/medium
  if (scorePercentage >= 40 && scorePercentage < 70) {
    console.log('→ Medium score: Choosing MIXED (easy/medium) questions');
    return 'mixed';
  }

  // If score is high (> 70%), consider expression
  if (scorePercentage >= 70) {
    if (emotion === 'happy' || emotion === 'focused') {
      console.log('→ High score + positive expression: Choosing HARD questions');
      return 'hard';
    } else if (emotion === 'angry' || emotion === 'confused') {
      console.log('→ High score + negative expression: Choosing MEDIUM questions');
      return 'medium';
    } else {
      console.log('→ High score + neutral expression: Choosing MEDIUM questions');
      return 'medium';
    }
  }

  return 'medium';
};

const generateConfetti = () => {
  const colors = ['#3498db', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6'];
  const confettiElements = [];
  
  for (let i = 0; i < 30; i++) {
    const left = `${Math.random() * 100}%`;
    const animationDelay = `${Math.random() * 3}s`;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    confettiElements.push(
      <div 
        key={i}
        className="confetti"
        style={{
          left,
          animationDelay,
          backgroundColor: color,
          width: `${5 + Math.random() * 10}px`,
          height: `${5 + Math.random() * 10}px`,
        }}
      />
    );
  }
  
  return confettiElements;
};

const TrickyGames = () => {
  console.log('🔍 Initializing TrickyGames component...');
  const navigate = useNavigate();
  const { level } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentExpression, setCurrentExpression] = useState('neutral');
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [finalEmotion, setFinalEmotion] = useState(null);
  const [scores, setScores] = useState([]);

  const fetchInitialQuestions = async (emotion = null) => {
    const levelNum = parseInt(level) || 1;
    console.log('🔍 Fetching Tricky questions with:', { level: levelNum, emotion, correctAnswers, wrongAnswers });
    try {
      const params = { level: String(levelNum) };
      if (emotion) params.emotion = emotion;
      if (correctAnswers > 0 || wrongAnswers > 0) {
        params.correctAnswers = correctAnswers;
        params.wrongAnswers = wrongAnswers;
        params.totalQuestions = correctAnswers + wrongAnswers;
      }
      
      params.category = 'tricky';
      const response = await api.get('/api/questions', { params });
      console.log('✅ Tricky questions fetched:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching Tricky questions:', err);
      setError('Failed to fetch questions. Please try again.');
      return [];
    }
  };

  const handleAnswer = async () => {
    if (!userAnswer) return;
    
    const currentQ = questions[currentQuestion];
    const correctValue = currentQ.correctAnswer || currentQ.answer;
    const isCorrect = userAnswer === correctValue;
    
    if (isCorrect) {
      setScore(score + 20);
      setCorrectAnswers(prev => prev + 1);
    } else {
      setWrongAnswers(prev => prev + 1);
    }

    const newScores = [...scores, isCorrect ? 20 : 0];
    setScores(newScores);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer('');
    } else {
      await completeLevel(newScores.reduce((a, b) => a + b, 0));
    }
  };

  const completeLevel = async (levelScore) => {
    console.log('🏁 Completing Tricky level with score:', levelScore);
    
    try {
      setLoading(true);
      
      if (isTracking) {
        console.log('🔍 Stopping expression tracking...');
        try {
          const response = await axios.post('http://localhost:5001/api/expressions/stop-tracking', {
            level,
            score: levelScore
          });
          
          console.log('✅ Expression tracking stopped, response:', response.data);
          
          const finalExpression = response.data.final_expression || 'neutral';
          const difficulty = response.data.difficulty || getDifficultyFromEmotion(finalExpression, score);
          
          console.log(`🎭 Final expression for level ${level}: ${finalExpression} (${difficulty} difficulty)`);
          
          setFinalEmotion({
            emotion: finalExpression,
            difficulty: difficulty
          });
          
        } catch (err) {
          console.error('Error stopping expression tracking:', err);
          setFinalEmotion({
            emotion: 'neutral',
            difficulty: 'medium'
          });
        } finally {
          setIsTracking(false);
        }
      }
      
      const childId = localStorage.getItem('userId');
      const userName = localStorage.getItem('name');
      const parentId = localStorage.getItem('parentId');
      const levelNum = level ? parseInt(level) : 1;

      try {
        const gameProgress = {
          childId,
          childName: userName || 'Student',
          parentId,
          gameType: 'tricky',
          level: levelNum,
          score: levelScore,
          correctAnswers,
          wrongAnswers,
          totalQuestions: questions.length,
          questions: questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer || q.answer,
            userAnswer: null,
            isCorrect: null
          })),
          emotion: finalEmotion?.emotion || 'neutral',
          expressionSamples: []
        };

        await axios.post('http://localhost:5000/api/game-progress/save', gameProgress);
        console.log('✅ Tricky game progress saved successfully');
      } catch (error) {
        console.error('Error saving Tricky game progress:', error);
      }

      setLevelCompleted(true);
      setLoading(false);
    } catch (err) {
      console.error('Error completing level:', err);
      setError('Failed to complete level. Please try again.');
      setLoading(false);
    }
  };

  const startLevel = async () => {
    console.log('🔍 Starting Tricky level...');
    try {
      setLoading(true);
      setError(null);
      
      // Reset state for new level
      setCurrentQuestion(0);
      setScore(0);
      setCorrectAnswers(0);
      setWrongAnswers(0);
      setUserAnswer('');
      setScores([]);
      setLevelCompleted(false);
      setFinalEmotion(null);

      console.log('🔑 Starting expression tracking with Flask (port 5001)...');
      try {
        const flaskResponse = await axios.post('http://localhost:5001/api/expressions/start-tracking', {});
        console.log('✅ Flask tracking started:', flaskResponse.data);
        setIsTracking(true);
      } catch (flaskErr) {
        console.error('Error starting Flask tracking:', flaskErr);
        setIsTracking(true);
      }

      const questions = await fetchInitialQuestions();
      setQuestions(questions);
      setLoading(false);
    } catch (err) {
      console.error('Error starting level:', err);
      setError('Failed to start level. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    startLevel();
    
    // Cleanup function to stop tracking when component unmounts
    return () => {
      if (isTracking) {
        setIsTracking(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const startNextLevel = () => {
    // Stop tracking before navigating
    if (isTracking) {
      setIsTracking(false);
    }
    
    const currentLevel = parseInt(level) || 1;
    const nextLevel = currentLevel + 1;
    console.log(`Current level: ${currentLevel}, Next level: ${nextLevel}`);
    navigate(`/tricky-games/level/${nextLevel}`);
  };

  const handlePlayAgain = async () => {
    // Stop tracking before navigating
    if (isTracking) {
      setIsTracking(false);
    }
    
    try {
      const childId = localStorage.getItem('userId');
      if (!childId) {
        console.error('No user ID found');
        return;
      }

      // Reset game progress for this subject
      await axios.post('http://localhost:5000/api/game-progress/reset', {
        childId,
        gameType: 'tricky'
      });

      console.log('✅ Tricky game progress reset successfully');
      navigate('/tricky-games-levels');
    } catch (error) {
      console.error('Error resetting game progress:', error);
    }
  };

  const handleBackToDashboard = () => {
    // Stop tracking before navigating
    if (isTracking) {
      setIsTracking(false);
    }
    navigate('/child-dashboard');
  };

  const progressPercentage = (currentQuestion / (questions.length || 1)) * 100;

  if (loading) {
    return (
      <div className="math-quiz-container">
        <div className="quiz-header">
          <h1 className="quiz-title">Tricky Challenge</h1>
        </div>
        <div className="quiz-card">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (levelCompleted) {
    const levelScore = scores.reduce((a, b) => a + b, 0);
    const totalPossibleScore = QUESTIONS_PER_LEVEL * 20;
    const scorePercentage = Math.round((levelScore / totalPossibleScore) * 100);
    
    // Stop tracking when showing result screen
    if (isTracking) {
      setIsTracking(false);
    }
    
    return (
      <div className="math-quiz-container">
        {generateConfetti()}
        
        <div className="quiz-header">
          <h1 className="quiz-title">{parseInt(level) < LEVELS ? 'Level Complete!' : 'Game Complete!'}</h1>
        </div>
        
        <div className="quiz-card level-complete-card">
          <h2 className="level-complete-title">
            {parseInt(level) < LEVELS ? `Level ${level} Complete!` : '🎉 Congratulations! 🎉'}
          </h2>
          
          <div className="score-display">
            <div className="score-circle" style={{background: `conic-gradient(#3498db 0deg, #3498db ${scorePercentage * 3.6}deg, #ecf0f1 ${scorePercentage * 3.6}deg)`}}>
              <div className="score-inner">
                <span className="score-value">{scorePercentage}%</span>
              </div>
            </div>
            <p className="score-text">Score: {levelScore}/{totalPossibleScore} points</p>
          </div>
          
          <div className="expression-result">
            <h3>Your Expression</h3>
            <div className="final-expression" style={{ color: getFinalEmotionColor(finalEmotion?.emotion) }}>
              {finalEmotion?.emotion || 'neutral'}
            </div>
          </div>

          {level < LEVELS ? (
            <button className="next-level-button" onClick={startNextLevel}>
              Start Level {parseInt(level) + 1}
            </button>
          ) : (
            <div className="game-complete">
              <p className="total-score">Total Score: {scores.reduce((a, b) => a + b, 0)} / {LEVELS * QUESTIONS_PER_LEVEL * 20}</p>
              <button className="submit-button" onClick={handlePlayAgain} style={{marginRight: '10px'}}>
                Play Again
              </button>
              <button className="submit-button" onClick={handleBackToDashboard}>
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="math-quiz-container">
      <div className="quiz-header">
        <h1 className="quiz-title">Tricky Challenge</h1>
      </div>
      
      {questions.length > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="quiz-card">
        <div className="level-indicator">Level {level}</div>
        
        <div className="quiz-content">
          <p className="question-number">Question {currentQuestion + 1} of {questions.length}</p>
          <h2 className="question-text">{questions[currentQuestion]?.question}</h2>

          <div className="options-grid">
            {questions[currentQuestion]?.options?.map((option, index) => (
              <button
                key={index}
                className={`option-button ${userAnswer === option ? 'selected' : ''}`}
                onClick={() => setUserAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>

          {userAnswer && (
            <div className="submit-section">
              <button
                className="submit-button"
                onClick={handleAnswer}
              >
                Submit Answer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expression tracking display */}
      <div className="expression-display">
        <p className="expression-title">Current Expression</p>
        <p className="expression-value" style={{ color: getFinalEmotionColor(currentExpression) }}>
          {currentExpression || 'neutral'}
        </p>
        <WebcamCapture
          isTracking={isTracking}
          onExpressionChange={setCurrentExpression}
        />
      </div>
    </div>
  );
};

export default TrickyGames;
