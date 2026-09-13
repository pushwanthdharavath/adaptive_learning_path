import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/ColorGame.css";

const ColorGame = () => {
  const navigate = useNavigate();
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [showingSequence, setShowingSequence] = useState(false);
  const colors = ['red', 'blue', 'green', 'yellow'];

  const showSequence = useCallback(async (seq) => {
    setShowingSequence(true);
    setUserSequence([]);

    for (let color of seq) {
      await new Promise(resolve => {
        const button = document.querySelector(`.color-button.${color}`);
        button.classList.add('active');
        setTimeout(() => {
          button.classList.remove('active');
          resolve();
        }, 500);
        setTimeout(resolve, 1000);
      });
    }

    setShowingSequence(false);
  }, []);

  const generateSequence = useCallback(() => {
    const newSequence = Array.from({ length: level + 2 }, () => 
      colors[Math.floor(Math.random() * colors.length)]
    );
    setSequence(newSequence);
    showSequence(newSequence);
  }, [level, colors, showSequence]);

  const startNewGame = useCallback(() => {
    setUserSequence([]);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    generateSequence();
  }, [generateSequence]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleColorClick = async (color) => {
    if (showingSequence || gameOver) return;

    const newUserSequence = [...userSequence, color];
    setUserSequence(newUserSequence);

    const button = document.querySelector(`.color-button.${color}`);
    button.classList.add('active');
    setTimeout(() => button.classList.remove('active'), 200);

    // Check if the user's sequence matches the game sequence
    if (newUserSequence[newUserSequence.length - 1] !== sequence[newUserSequence.length - 1]) {
      setGameOver(true);
      // Save game result
      try {
        await axios.post('/api/game/result', {
          gameType: 'color',
          score,
          level
        });
      } catch (error) {
        console.error('Error saving game result:', error);
      }
      return;
    }

    // If user completed the sequence correctly
    if (newUserSequence.length === sequence.length) {
      const newScore = score + level * 10;
      const newLevel = level + 1;
      setScore(newScore);
      setLevel(newLevel);
      
      // Save progress
      try {
        await axios.post('/api/game/result', {
          gameType: 'color',
          score: newScore,
          level: newLevel
        });
      } catch (error) {
        console.error('Error saving game result:', error);
      }

      setTimeout(() => {
        setUserSequence([]);
        generateSequence();
      }, 1000);
    }
  };

  return (
    <div className="color-game-container">
      <div className="game-info">
        <h2>Color Memory Game</h2>
        <div className="stats">
          <p>Level: {level}</p>
          <p>Score: {score}</p>
        </div>
        <button className="back-button" onClick={() => navigate('/child-dashboard')}>
          Back to Dashboard
        </button>
      </div>

      <div className="color-grid">
        {colors.map(color => (
          <button
            key={color}
            className={`color-button ${color}`}
            onClick={() => handleColorClick(color)}
            disabled={showingSequence}
          />
        ))}
      </div>

      {gameOver && (
        <div className="game-over">
          <h3>Game Over!</h3>
          <p>Final Score: {score}</p>
          <p>Level Reached: {level}</p>
          <button onClick={startNewGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default ColorGame;