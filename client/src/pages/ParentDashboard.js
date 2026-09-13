import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../styles/ParentDashboard.css";

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const parentName = localStorage.getItem('parentName');
  const [parentCode, setParentCode] = useState('');
  const [selectedChild, setSelectedChild] = useState(null);
  const [gameResults, setGameResults] = useState({ math: [] });
  const [quizLevelData, setQuizLevelData] = useState({});
  const navigate = useNavigate();

  // Add animated space background
  useEffect(() => {
    const addSpaceBackground = () => {
      const container = document.querySelector('.parent-dashboard');
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
        planet.style.animationDelay = Math.random() * 8 + 's';
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
    // Get parent code from localStorage
    const code = localStorage.getItem('parentCode');
    setParentCode(code || '');
    fetchChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildHistory(selectedChild._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild]);

  useEffect(() => {
    if (Object.keys(gameResults).length > 0) {
      organizeGameHistoryByLevels();
    } else {
      initializeEmptyLevels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameResults]);
  
  const getParentQuote = () => {
    const quotes = [
      "The greatest gift you can give your children are the roots of responsibility and the wings of independence.",
      "Children are great imitators, so give them something great to imitate.",
      "A parent's love is whole no matter how many times divided.",
      "Your children need your presence more than your presents.",
      "Each day of our lives we make deposits in the memory banks of our children."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };
  
  const initializeEmptyLevels = () => {
    const emptyData = {
      math: { name: 'Math Quiz', levels: {} },
      english: { name: 'English Quiz', levels: {} },
      science: { name: 'Science Quiz', levels: {} },
      tricky: { name: 'Tricky Games', levels: {} }
    };

    Object.keys(emptyData).forEach(gameType => {
      for (let i = 1; i <= 5; i++) {
        emptyData[gameType].levels[i] = {
          attempts: 0,
          highScore: 0,
          bestScore: 0,
          averageScore: 0,
          played: false,
          correctAnswers: 0,
          wrongAnswers: 0,
          emotions: []
        };
      }
    });

    setQuizLevelData(emptyData);
  };

  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const parentId = localStorage.getItem('userId'); // Parent's own ID
      const parentCode = localStorage.getItem('parentCode');
      console.log('🔍 Fetching children for parent:');
      console.log('  - Parent ID (userId):', parentId);
      console.log('  - Parent Code:', parentCode);

      if (!parentId) {
        console.error('❌ No parent ID found in localStorage');
        setChildren([]);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/users/parent/${parentId}/children`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Children fetched:', response.data);
        console.log('  - Number of children:', response.data.length);
        setChildren(response.data);

        if (response.data.length > 0) {
          setSelectedChild(response.data[0]);
        }
      } catch (mainError) {
        console.error('❌ Error fetching children via parent ID:', mainError);
        try {
          const fallbackResponse = await axios.get('http://localhost:5000/api/users/children', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          console.log('✅ Children fetched via fallback:', fallbackResponse.data);
          setChildren(fallbackResponse.data);

          if (fallbackResponse.data.length > 0) {
            setSelectedChild(fallbackResponse.data[0]);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          setChildren([]);
        }
      }
    } catch (error) {
      console.error('❌ Error in fetchChildren:', error);
      setChildren([]);
    }
  };

  const fetchChildHistory = async (childId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/game-progress/history/${childId}`);
      
      setGameResults(response.data);
    } catch (error) {
      console.error('Error in fetchChildHistory:', error);
      setGameResults({});
    }
  };
  
  const organizeGameHistoryByLevels = () => {
    const quizData = {
      math: { name: 'Math Quiz', levels: {} },
      english: { name: 'English Quiz', levels: {} },
      science: { name: 'Science Quiz', levels: {} },
      tricky: { name: 'Tricky Games', levels: {} }
    };

    Object.keys(quizData).forEach(gameType => {
      for (let i = 1; i <= 5; i++) {
        quizData[gameType].levels[i] = {
          attempts: 0,
          highScore: 0,
          bestScore: 0,
          averageScore: 0,
          played: false,
          correctAnswers: 0,
          wrongAnswers: 0,
          emotions: []
        };
      }
    });

    if (!gameResults || typeof gameResults !== 'object' || Object.keys(gameResults).length === 0) {
      setQuizLevelData(quizData);
      return;
    }

    Object.entries(gameResults).forEach(([gameType, gameData]) => {
      if (!quizData[gameType]) return;

      if (gameData && gameData.gameHistory && Array.isArray(gameData.gameHistory)) {
        gameData.gameHistory.forEach(history => {
          const level = history.level || 1;

          if (level >= 1 && level <= 5) {
            const levelData = quizData[gameType].levels[level];
            levelData.attempts++;
            levelData.highScore = Math.max(levelData.highScore, history.score || 0);
            levelData.bestScore = Math.max(levelData.bestScore, history.score || 0);
            levelData.averageScore = Math.round(levelData.highScore / levelData.attempts);
            levelData.played = true;
            levelData.correctAnswers += history.correctAnswers || 0;
            levelData.wrongAnswers += history.wrongAnswers || 0;
            if (history.emotion) {
              levelData.emotions.push(history.emotion);
            }
          }
        });
      }
    });

    setQuizLevelData(quizData);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="parent-dashboard">
      <div className="space-background"></div>
      
      <header className="dashboard-header">
        <h1 className="dashboard-title">👨‍👩‍👧‍👦 {parentName || 'Parent'}'s Family Dashboard</h1>
        <p className="dashboard-subtitle">Tracking your child's amazing learning journey! 🌟</p>
        <button onClick={handleLogout} className="logout-button">
          🚪 Logout
        </button>
      </header>

      <div style={{margin: '20px 0', padding: '20px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '25px', backdropFilter: 'blur(10px)', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)', position: 'relative', zIndex: '1'}}>
        <p style={{fontSize: '18px', color: 'white', fontStyle: 'italic', fontWeight: '500'}}>
          💝 {getParentQuote()}
        </p>
      </div>

      <div className="children-section">
        <h2 className="section-title">👦 Your Little Explorers</h2>

        {children.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: 'white', position: 'relative', zIndex: '1'}}>
            <p style={{fontSize: '20px', marginBottom: '10px'}}>No children added yet!</p>
            <p style={{fontSize: '18px', marginBottom: '20px'}}>Please signup your child using your special Parent Code:</p>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px 40px',
              borderRadius: '15px',
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              display: 'inline-block',
              marginBottom: '20px',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
            }}>
              🔑 {parentCode || 'Loading...'}
            </div>
            <p style={{fontSize: '16px', marginTop: '15px'}}>
              Share this code with your child during signup to connect their account!
            </p>
          </div>
        ) : (
          <>
            <div className="children-grid">
              {children.map(child => (
                <div
                  key={child._id}
                  className="child-card"
                  onClick={() => setSelectedChild(child)}
                  style={{border: selectedChild?._id === child._id ? '4px solid #667eea' : '4px solid rgba(102, 126, 234, 0.3)'}}
                >
                  <span className="child-avatar">👦</span>
                  <h3 className="child-name">{child.name}</h3>
                  <p className="child-info">🎂 Age: {child.age}</p>
                  <p className="child-info">🎯 Role: {child.role}</p>

                  <div className="child-stats">
                    <div className="stat-item">
                      <div className="stat-value">5</div>
                      <div className="stat-label">Days</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">3</div>
                      <div className="stat-label">Levels</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">85%</div>
                      <div className="stat-label">High Score</div>
                    </div>
                  </div>

                  <button className="view-details-button">📊 View Progress</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedChild && (
        <div className="progress-section">
          <div className="progress-header">
            <h2 className="progress-title">📊 {selectedChild.name}'s Learning Progress</h2>
          </div>
          
          <div className="progress-summary">
            <div className="summary-card">
              <span className="summary-icon">🎯</span>
              <div className="summary-value">5</div>
              <div className="summary-label">Levels Played</div>
            </div>

            <div className="summary-card">
              <span className="summary-icon">⭐</span>
              <div className="summary-value">85%</div>
              <div className="summary-label">High Score</div>
            </div>

            <div className="summary-card">
              <span className="summary-icon">🏆</span>
              <div className="summary-value">2</div>
              <div className="summary-label">Badges Earned</div>
            </div>

            <div className="summary-card">
              <span className="summary-icon">📅</span>
              <div className="summary-value">5</div>
              <div className="summary-label">Active Days</div>
            </div>
          </div>
          
          {Object.keys(quizLevelData).length > 0 && (
            <div style={{marginTop: '30px'}}>
              {Object.entries(quizLevelData).map(([gameType, gameData]) => (
                <div key={gameType} style={{marginBottom: '40px'}}>
                  <h3 style={{fontSize: '22px', color: '#2c3e50', marginBottom: '20px', textAlign: 'center'}}>
                    🎮 {gameData.name} Progress
                  </h3>
                  <div style={{display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap'}}>
                    {Object.entries(gameData.levels)
                      .sort(([levelA], [levelB]) => parseInt(levelA) - parseInt(levelB))
                      .map(([level, levelData]) => (
                        <div 
                          key={level} 
                          style={{
                            background: levelData.played ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                            padding: '20px',
                            borderRadius: '20px',
                            textAlign: 'center',
                            minWidth: '120px',
                            color: levelData.played ? 'white' : '#666',
                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '5px'}}>Level {level}</div>
                          {levelData.played ? (
                            <>
                              <div style={{fontSize: '28px', fontWeight: 'bold'}}>{levelData.bestScore}%</div>
                              <div style={{fontSize: '12px', marginTop: '5px'}}>
                                ✅ {levelData.correctAnswers} | ❌ {levelData.wrongAnswers}
                              </div>
                              {levelData.emotions.length > 0 && (
                                <div style={{fontSize: '12px', marginTop: '3px'}}>
                                  🎭 {levelData.emotions[0]}
                                </div>
                              )}
                            </>
                          ) : (
                            <div style={{fontSize: '16px'}}>Not Played</div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}