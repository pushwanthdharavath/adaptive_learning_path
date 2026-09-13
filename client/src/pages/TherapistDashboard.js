import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/TherapistDashboard.css';

export default function TherapistDashboard() {
  const [gameResults, setGameResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const therapistName = localStorage.getItem('therapistName') || localStorage.getItem('name') || 'Therapist';
  const navigate = useNavigate();

  // Add animated space background
  useEffect(() => {
    const addSpaceBackground = () => {
      const container = document.querySelector('.therapist-dashboard');
      if (!container || document.querySelector('.space-background')) return;

      const background = document.createElement('div');
      background.className = 'space-background';
      
      // Add stars
      for (let i = 0; i < 25; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.textContent = ['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)];
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (2 + Math.random() * 2) + 's';
        background.appendChild(star);
      }
      
      // Add planets
      for (let i = 0; i < 4; i++) {
        const planet = document.createElement('div');
        planet.className = 'planet';
        planet.textContent = ['🪐', '🌍', '🌙', '☄️'][Math.floor(Math.random() * 4)];
        planet.style.left = Math.random() * 100 + '%';
        planet.style.top = Math.random() * 100 + '%';
        planet.style.animationDelay = Math.random() * 7 + 's';
        planet.style.animationDuration = (6 + Math.random() * 4) + 's';
        background.appendChild(planet);
      }
      
      container.appendChild(background);
    };
    
    addSpaceBackground();
    
    return () => {
      const background = document.querySelector('.space-background');
      if (background) background.remove();
    };
  }, []);

  useEffect(() => {
    fetchAllChildrenHistory();
  }, []);

  const fetchAllChildrenHistory = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('http://localhost:5000/api/game-progress/all-children');
      
      setGameResults(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching children history:', error);
      setError('Failed to fetch children data. Please try again later.');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const getRandomQuote = () => {
    const quotes = [
      "Every child is a different kind of flower, and all together make this world a beautiful garden.",
      "The beautiful thing about learning is that no one can take it away from you.",
      "Education is not the filling of a pail, but the lighting of a fire.",
      "Children are not things to be molded, but are people to be unfolded.",
      "Play is our brain's favorite way of learning."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const getEncouragementMessage = (count) => {
    if (count === 0) {
      return "Ready to start tracking progress! Add new quiz results to see the magic happen.";
    } else if (count < 5) {
      return "Great start! Continue adding more results to track progress over time.";
    } else if (count < 10) {
      return "Building a solid foundation of data! Keep encouraging those math skills.";
    } else {
      return "Impressive collection of results! You're gaining valuable insights into learning patterns.";
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Calculate stats from new data structure
  const totalStudents = gameResults.length;
  let totalAttempts = 0;
  let totalScore = 0;
  let highScores = 0;

  gameResults.forEach(child => {
    if (child && child.games) {
      Object.values(child.games).forEach(game => {
        totalAttempts += game.totalGamesPlayed || 0;
        totalScore += game.totalScore || 0;
        if (game.totalScore > 0) {
          const avg = game.totalScore / game.totalGamesPlayed;
          if (avg >= 80) highScores++;
        }
      });
    }
  });

  const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

  return (
    <div className="therapist-dashboard">
      <div className="space-background"></div>
      
      <header className="dashboard-header">
        <h1 className="dashboard-title">👩‍⚕️ {therapistName}'s Professional Dashboard</h1>
        <p className="dashboard-subtitle">Monitoring student progress with care! 🌟</p>
        <button onClick={handleLogout} className="logout-button">
          🚪 Logout
        </button>
      </header>

      <div style={{margin: '20px 0', padding: '20px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '25px', backdropFilter: 'blur(10px)', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)', position: 'relative', zIndex: '1'}}>
        <p style={{fontSize: '18px', color: 'white', fontStyle: 'italic', fontWeight: '500'}}>
          💝 {getRandomQuote()}
        </p>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="loading-spinner">🔄</span>
          <p>Loading math quiz results...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchAllChildrenHistory} className="retry-button">
            🔄 Retry
          </button>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="stats-overview">
            <div className="stat-card">
              <span className="stat-icon">👦</span>
              <div className="stat-number">{totalStudents}</div>
              <div className="stat-label">Students</div>
            </div>
            
            <div className="stat-card">
              <span className="stat-icon">📊</span>
              <div className="stat-number">{totalAttempts}</div>
              <div className="stat-label">Total Attempts</div>
            </div>
            
            <div className="stat-card">
              <span className="stat-icon">⭐</span>
              <div className="stat-number">{averageScore}%</div>
              <div className="stat-label">Average Score</div>
            </div>
            
            <div className="stat-card">
              <span className="stat-icon">🎯</span>
              <div className="stat-number">{gameResults.filter(r => r.score >= 80).length}</div>
              <div className="stat-label">High Scores</div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="analytics-section">
            <div className="analytics-header">
              <h2 className="analytics-title">📈 Learning Analytics</h2>
            </div>
            
            <div className="analytics-grid">
              <div className="analytics-card">
                <span className="analytics-icon">📅</span>
                <div className="analytics-value">7</div>
                <div className="analytics-label">Days Tracked</div>
              </div>
              
              <div className="analytics-card">
                <span className="analytics-icon">🏆</span>
                <div className="analytics-value">5</div>
                <div className="analytics-label">Levels Completed</div>
              </div>
              
              <div className="analytics-card">
                <span className="analytics-icon">📈</span>
                <div className="analytics-value">+15%</div>
                <div className="analytics-label">Improvement</div>
              </div>
              
              <div className="analytics-card">
                <span className="analytics-icon">🎉</span>
                <div className="analytics-value">12</div>
                <div className="analytics-label">Badges Earned</div>
              </div>
            </div>
          </div>

          {/* Students Section */}
          <h2 className="section-title">👦 Student Progress</h2>
          
          {gameResults.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px', color: 'white', position: 'relative', zIndex: '1'}}>
              <p style={{fontSize: '20px', marginBottom: '20px'}}>No children data found yet!</p>
              <button onClick={fetchAllChildrenHistory} className="retry-button">
                🔄 Refresh Data
              </button>
            </div>
          ) : (
            <>
              <div style={{marginBottom: '20px', textAlign: 'center', position: 'relative', zIndex: '1'}}>
                <div style={{padding: '15px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '20px', backdropFilter: 'blur(10px)', display: 'inline-block'}}>
                  <p style={{fontSize: '18px', color: 'white', fontWeight: '500'}}>
                    💡 {getEncouragementMessage(gameResults.length)}
                  </p>
                </div>
              </div>
              
              <div className="students-grid">
                {gameResults.map((child, index) => {
                  let childTotalScore = 0;
                  let childTotalGames = 0;
                  let childHighestLevel = 0;
                  
                  if (child && child.games) {
                    Object.values(child.games).forEach(game => {
                      childTotalScore += game.totalScore || 0;
                      childTotalGames += game.totalGamesPlayed || 0;
                      childHighestLevel = Math.max(childHighestLevel, game.highestLevelReached || 0);
                    });
                  }
                  
                  const childAvgScore = childTotalGames > 0 ? Math.round(childTotalScore / childTotalGames) : 0;
                  const gameTypes = child && child.games ? Object.keys(child.games) : [];
                  
                  return (
                    <div key={index} className="student-card">
                      <span className="student-avatar">👦</span>
                      <h3 className="student-name">{child.childName || 'Unknown'}</h3>
                      <p className="student-info">📊 {childTotalGames} total games</p>
                      
                      <div className="student-progress">
                        <div className="progress-item">
                          <div className="progress-value">{childAvgScore}%</div>
                          <div className="progress-label">Avg</div>
                        </div>
                        <div className="progress-item">
                          <div className="progress-value">{childHighestLevel}</div>
                          <div className="progress-label">Max Level</div>
                        </div>
                        <div className="progress-item">
                          <div className="progress-value">{gameTypes.length}</div>
                          <div className="progress-label">Game Types</div>
                        </div>
                      </div>
                      
                      <div style={{marginTop: '10px', fontSize: '12px', color: 'white'}}>
                        {gameTypes.map(gameType => (
                          <span key={gameType} style={{marginRight: '8px', background: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '10px'}}>
                            {gameType}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{textAlign: 'center', marginTop: '30px', position: 'relative', zIndex: '1'}}>
                <button onClick={fetchAllChildrenHistory} className="retry-button">
                  🔄 Refresh Data
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}