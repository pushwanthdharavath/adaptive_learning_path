import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import WebcamCapture from '../components/common/WebcamCapture';
import '../styles/MathQuizStyles.css';
import api from '../api';

const LEVELS = 5;
const QUESTIONS_PER_LEVEL = 5;

// Helper functions for emotion display
const getFinalEmotionColor = (emotion) => {
  if (!emotion) return '#666'; // Default gray
  
  switch(emotion) {
    case 'happy':
    case 'surprised':
      return '#4caf50'; // Green for positive emotions
    case 'neutral':
    case 'focused':
      return '#2196f3'; // Blue for neutral/focused emotions
    case 'sad':
    case 'angry':
    case 'confused':
      return '#f44336'; // Red for negative emotions
    default:
      return '#666'; // Default gray
  }
};

const getFinalEmotionMessage = (emotion) => {
  if (!emotion) return 'No expression detected';
  
  switch(emotion) {
    case 'happy':
      return 'You seemed happy with the challenge! Next level will be harder.';
    case 'surprised':
      return 'You looked surprised! We\'ll give you harder questions next time';
    case 'neutral':
      return 'You remained neutral. Next level will be medium difficulty';
    case 'focused':
      return 'Great focus! We\'ll keep the challenge at medium difficulty';
    case 'sad':
      return 'You seemed a bit frustrated. Next level will be easier';
    case 'angry':
      return 'You looked stressed. We\'ll make the next level easier';
    case 'confused':
      return 'You seemed confused. Next level will be easier to help you learn';
    default:
      return 'We\'ll adjust the difficulty based on your expression';
  }
};

// Generate confetti elements for the level completion animation
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

const MathQuizGame = () => {
  console.log('🔍 Initializing MathQuizGame component...');
  const expressionIntervalId = useRef(null);
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [current, setCurrent] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [nextLevelQuestions, setNextLevelQuestions] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentExpression, setCurrentExpression] = useState('neutral');
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [finalEmotion, setFinalEmotion] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  const fetchInitialQuestions = async (emotion = null) => {
    console.log('🔍 Fetching questions with:', { level, emotion, correctAnswers, wrongAnswers });
    try {
      // Fetch questions from API with performance data
      const params = { level: String(level) };
      if (emotion) params.emotion = emotion;
      if (correctAnswers > 0 || wrongAnswers > 0) {
        params.correctAnswers = correctAnswers;
        params.wrongAnswers = wrongAnswers;
        params.totalQuestions = correctAnswers + wrongAnswers;
      }
      
      params.category = 'math';
      const response = await api.get('/api/questions', { params });
      console.log('✅ Questions fetched:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to fetch questions. Please try again.');
      return [];
    }
  };

  const handleAnswer = async () => {
    if (!userAnswer) return;
    
    // Get the current question
    const currentQuestion = questions[current];
    
    // Check if the answer is correct (handle both answer and correctAnswer fields)
    const correctValue = currentQuestion.correctAnswer || currentQuestion.answer;
    const isCorrect = userAnswer === correctValue;
    
    // Track correct/wrong answers
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    } else {
      setWrongAnswers(prev => prev + 1);
    }
    
    // Calculate score - 20 points for correct answer, 0 for incorrect
    const score = isCorrect ? 20 : 0;
    
    // Add to scores array
    const newScores = [...scores, score];
    setScores(newScores);
    
    // Move to next question or complete level
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setUserAnswer('');
    } else {
      // Level complete
      await completeLevel(newScores.reduce((a, b) => a + b, 0));
    }
  };

  const completeLevel = async (score) => {
    console.log('🏁 Completing level with score:', score);
    
    try {
      setLoading(true);
      
      if (isTracking) {
        console.log('🔍 Stopping expression tracking and determining final expression...');
        try {
          // Send stop-tracking request directly to Flask
          console.log('🔑 Sending stop-tracking request directly to Flask (port 5001)');
          
          // Communicate directly with Flask
          const response = await axios.post('http://localhost:5001/api/expressions/stop-tracking', {
            level,
            score
          });
          
          console.log('✅ Expression tracking stopped, response:', response.data);
          
          // Process the final expression data from Flask
          const finalExpression = response.data.final_expression || 'neutral';
          const difficulty = response.data.difficulty || getDifficultyFromEmotion(finalExpression, score);
          
          console.log(`🎭 Final expression for level ${level}: ${finalExpression} (${difficulty} difficulty)`);
          
          // Set the final emotion state with both expression and difficulty
          setFinalEmotion({
            emotion: finalExpression,
            difficulty: difficulty
          });
          
          // If Flask also returned questions, use them for the next level
          if (response.data.questions && Array.isArray(response.data.questions)) {
            console.log('Using pre-fetched questions from Flask for next level');
            setNextLevelQuestions(response.data.questions);
          }
          
        } catch (err) {
          console.error('Error stopping expression tracking:', err);
          // Fallback to a neutral expression if there's an error
          setFinalEmotion({
            emotion: 'neutral',
            difficulty: 'medium'
          });
        } finally {
          setIsTracking(false);
        }
      }
      
      // Save the game result to database
      try {
        console.log('💾 Saving game result to database...');
        const token = localStorage.getItem('token');
        const childId = localStorage.getItem('userId');
        const userName = localStorage.getItem('name');
        const parentId = localStorage.getItem('parentId');

        // Save to GameProgress endpoint
        const gameProgress = {
          childId,
          childName: userName || 'Student',
          parentId,
          gameType: 'math',
          level: level || 1,
          score,
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

        console.log('Saving game progress with data:', gameProgress);

        const progressResponse = await axios.post('http://localhost:5000/api/game-progress/save', gameProgress);
        console.log('✅ Game progress saved successfully:', progressResponse.data);

        // Also save to general game results endpoint for backward compatibility
        if (token) {
          const gameResult = {
            gameType: 'math',
            score: score,
            level: level || 1,
            difficulty: finalEmotion?.difficulty || 'medium',
            timeElapsed: 0,
            userName: userName || 'Student',
            childName: userName || 'Student',
            parentId: parentId
          };

          const saveResponse = await axios.post('http://localhost:5000/api/games/result', gameResult, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('✅ Game result saved successfully:', saveResponse.data);
        }
      } catch (saveErr) {
        console.error('Error saving game result:', saveErr);
        // Don't block the UI flow if saving fails
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
    console.log('🔍 Starting level...');
    try {
      setLoading(true);
      setError(null);

      // Start expression tracking directly with Flask
      console.log('🔑 Starting expression tracking with Flask (port 5001)...');
      try {
        // Communicate directly with Flask at port 5001
        const flaskResponse = await axios.post('http://localhost:5001/api/expressions/start-tracking', {});
        console.log('✅ Flask tracking started:', flaskResponse.data);
        setIsTracking(true);
      } catch (flaskErr) {
        console.error('Error starting Flask tracking:', flaskErr);
        // Continue even if tracking fails
        setIsTracking(true); // Still set tracking to true for the UI
      }

      const questions = await fetchInitialQuestions();
      setQuestions(questions);
      setLoading(false);
    } catch (err) {
      setError('Failed to start level. Please try again.');
      setLoading(false);
    }
  };

  const startNextLevel = async () => {
    console.log('🔍 Starting next level...');
    
    // Stop tracking before navigating
    if (isTracking) {
      setIsTracking(false);
    }
    
    try {
      setLevelCompleted(false);
      setLoading(true);
      setScores([]);
      setLevel(prev => prev + 1);
      setCurrent(0);
      setUserAnswer('');
      // Reset performance tracking for new level
      setCorrectAnswers(0);
      setWrongAnswers(0);

      // Start expression tracking directly with Flask
      console.log('🔑 Starting expression tracking for next level with Flask (port 5001)...');
      try {
        // Communicate directly with Flask at port 5001
        const flaskResponse = await axios.post('http://localhost:5001/api/expressions/start-tracking', {});
        console.log('✅ Flask tracking started for next level:', flaskResponse.data);
        setIsTracking(true);
      } catch (flaskErr) {
        console.error('Error starting Flask tracking for next level:', flaskErr);
        // Continue even if tracking fails
        setIsTracking(true); // Still set tracking to true for the UI
      }

      // Use pre-fetched questions from Flask if available, otherwise fetch new ones
      if (nextLevelQuestions && nextLevelQuestions.length > 0) {
        console.log('Using pre-fetched questions from Flask');
        setQuestions(nextLevelQuestions);
        setNextLevelQuestions(null); // Clear after using
      } else {
        console.log('Fetching new questions based on emotion:', finalEmotion?.emotion);
        console.log('Performance from previous level:', { correctAnswers, wrongAnswers });
        const questions = await fetchInitialQuestions(finalEmotion?.emotion);
        setQuestions(questions);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to start next level. Please try again.');
      setLoading(false);
    }
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
        gameType: 'math'
      });

      console.log('✅ Math game progress reset successfully');
      navigate('/math-quiz-levels');
    } catch (error) {
      console.error('Error resetting game progress:', error);
    }
  };

  // Initial setup effect - only runs once when component mounts
  useEffect(() => {
    startLevel();
    
    // Cleanup function when component unmounts
    return () => {
      const intervalId = expressionIntervalId.current;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (isTracking) {
        setIsTracking(false);
        api.post('/api/expressions/stop-tracking')
          .catch(err => console.error('Error stopping tracking:', err));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to determine difficulty based on both score and emotion
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
  
  // Determine the difficulty mode for styling
  const getDifficultyMode = () => {
    if (!questions.length) return '';
    const difficulty = questions[0]?.difficulty || 'medium';
    return `${difficulty}-mode`;
  };
  
  // Calculate progress percentage
  const progressPercentage = (current / (questions.length || 1)) * 100;

  if (loading) {
    return (
      <div className="math-quiz-container">
        <div className="quiz-header">
          <h1 className="quiz-title">Math Challenge</h1>
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
    // Final score calculation
    const levelScore = scores.reduce((a, b) => a + b, 0);
    const totalPossibleScore = QUESTIONS_PER_LEVEL * 20;
    const scorePercentage = Math.round((levelScore / totalPossibleScore) * 100);
    
    // Stop tracking when showing result screen
    if (isTracking) {
      setIsTracking(false);
    }
    
    return (
      <div className="math-quiz-container">
        {/* Generate confetti animation for celebration */}
        {generateConfetti()}
        
        <div className="quiz-header">
          <h1 className="quiz-title">{level < LEVELS ? 'Level Complete!' : 'Game Complete!'}</h1>
        </div>
        
        <div className="quiz-card level-complete-card">
          <h2 className="level-complete-title">
            {level < LEVELS ? `Level ${level} Complete!` : '🎉 Congratulations! 🎉'}
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
              Start Level {level + 1}
            </button>
          ) : (
            <div className="game-complete">
              <p className="total-score">Total Score: {scores.reduce((a, b) => a + b, 0)} / {LEVELS * QUESTIONS_PER_LEVEL * 20}</p>
              <button className="submit-button" onClick={handlePlayAgain} style={{marginRight: '10px'}}>
                Play Again
              </button>
              <button className="submit-button" onClick={() => {
                if (isTracking) {
                  setIsTracking(false);
                }
                navigate('/child-dashboard');
              }}>
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
      {/* Quiz header */}
      <div className="quiz-header">
        <h1 className="quiz-title">Math Challenge</h1>
      </div>
      
      {/* Progress bar */}
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
      
      {/* Error message if any */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Main quiz card */}
      <div className={`quiz-card ${getDifficultyMode()}`}>
        {/* Level indicator */}
        <div className="level-indicator">Level {level}</div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading questions...</p>
          </div>
        ) : (
          <div className="quiz-content">
            <p className="question-number" style={{fontSize: '22px', fontWeight: 'bold'}}>Question {current + 1} of {questions.length}</p>
            <h2 className="question-text" style={{fontSize: '28px', marginBottom: '30px'}}>{questions[current]?.question}</h2>
            
            <div className="options-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '15px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              {questions[current]?.options?.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${userAnswer === option ? 'selected' : ''}`}
                  style={{
                    fontSize: '28px',
                    padding: '25px 20px',
                    borderRadius: '15px',
                    fontWeight: 'bold',
                    minHeight: '90px',
                    backgroundColor: userAnswer === option ? '#667eea' : 'white',
                    color: userAnswer === option ? 'white' : '#2c3e50',
                    border: '3px solid #667eea',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setUserAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {userAnswer && (
              <div className="submit-section" style={{marginTop: '30px'}}>
                <button 
                  className="submit-button" 
                  onClick={handleAnswer}
                  style={{
                    fontSize: '22px',
                    padding: '15px 40px',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#219653';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#27ae60';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Submit Answer
                </button>
              </div>
            )}
          </div>
        )}
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

export default MathQuizGame;
