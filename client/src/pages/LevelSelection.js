import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LevelSelectionStyles.css";

const LevelSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({
    unlockedLevels: [1],
    starsPerLevel: {},
    totalGamesPlayed: 0,
    highScore: 0,
    highestLevelReached: 1,
    needsReset: false
  });

  const gameType = 'math';
  const childId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProgress = async () => {
      if (!childId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/game-progress/${childId}/${gameType}`);
        const data = await response.json();
        setProgress(data);
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [childId, gameType]);

  const levels = [
    { id: 1, difficulty: 'Easy', status: 'unlocked', stars: progress.starsPerLevel['1'] || 0 },
    { id: 2, difficulty: 'Easy', status: progress.unlockedLevels.includes(2) ? 'unlocked' : 'locked', stars: progress.starsPerLevel['2'] || 0 },
    { id: 3, difficulty: 'Medium', status: progress.unlockedLevels.includes(3) ? 'unlocked' : 'locked', stars: progress.starsPerLevel['3'] || 0 },
    { id: 4, difficulty: 'Medium', status: progress.unlockedLevels.includes(4) ? 'unlocked' : 'locked', stars: progress.starsPerLevel['4'] || 0 },
    { id: 5, difficulty: 'Hard', status: progress.unlockedLevels.includes(5) ? 'unlocked' : 'locked', stars: progress.starsPerLevel['5'] || 0 },
  ];

  const playerInfo = {
    totalStars: Object.values(progress.starsPerLevel).reduce((a, b) => a + b, 0),
    highestLevel: progress.highestLevelReached,
    highScore: progress.highScore || 0
  };

  const handleLevelClick = (level) => {
    if (level.status === 'locked') {
      return;
    }
    navigate(`/math-quiz/level/${level.id}`);
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to play again? All progress will be reset!')) {
      return;
    }

    try {
      await fetch('http://localhost:5000/api/game-progress/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, gameType })
      });

      // Reload progress
      const response = await fetch(`http://localhost:5000/api/game-progress/${childId}/${gameType}`);
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  // Function to render stars based on level completion (0-3 stars)
  const renderStars = (count) => {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      stars.push(
        <span key={i} className={`status-star ${i < count ? '' : 'empty'}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return <div className="level-selection-container">Loading...</div>;
  }

  return (
    <div className="level-selection-container">
      <div className="level-content">
        <header className="level-header">
          <h1 className="level-title">Math Quiz Levels</h1>
          <p className="level-subtitle">Choose your challenge and earn stars!</p>
        </header>
        
        {/* Level info section */}
        <div className="level-info">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-value">{playerInfo.totalStars}</div>
              <div className="info-label">Stars Earned</div>
            </div>
            <div className="info-item">
              <div className="info-value">{playerInfo.highestLevel}</div>
              <div className="info-label">Highest Level</div>
            </div>
            <div className="info-item">
              <div className="info-value">{playerInfo.highScore}</div>
              <div className="info-label">High Score</div>
            </div>
          </div>
        </div>
        
        <div className="levels-grid">
          {levels.map((level) => (
            <div 
              className={`level-card ${level.status === 'locked' ? 'locked-level' : ''}`} 
              key={level.id} 
              onClick={() => handleLevelClick(level)}
            >
              <div className="level-number">{level.id}</div>
              <div className="level-difficulty">{level.difficulty}</div>
              
              <div className="level-status">
                {renderStars(level.stars)}
              </div>
              
              <button 
                className="level-button" 
                disabled={level.status === 'locked'}
              >
                {level.status === 'locked' ? 'Locked' : 'Start Level'}
              </button>
            </div>
          ))}
        </div>
        
        {progress.needsReset && (
          <button className="reset-button" onClick={handleReset}>
            🎮 Play Again (Reset Progress)
          </button>
        )}
        
        <button className="back-button" onClick={() => navigate('/child-dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default LevelSelection;
