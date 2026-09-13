import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/ChildDashboard.css";

export default function ChildDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const [childName, setChildName] = useState('Space Explorer');

  // Add animated space background
  useEffect(() => {
    const addSpaceBackground = () => {
      const container = document.querySelector('.child-dashboard');
      if (!container || document.querySelector('.space-background')) return;

      const background = document.createElement('div');
      background.className = 'space-background';

      // Add stars
      for (let i = 0; i < 30; i++) {
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
      for (let i = 0; i < 5; i++) {
        const planet = document.createElement('div');
        planet.className = 'planet';
        planet.textContent = ['🪐', '🌍', '🌙', '☄️', '🌞'][Math.floor(Math.random() * 5)];
        planet.style.left = Math.random() * 100 + '%';
        planet.style.top = Math.random() * 100 + '%';
        planet.style.animationDelay = Math.random() * 6 + 's';
        planet.style.animationDuration = (4 + Math.random() * 4) + 's';
        background.appendChild(planet);
      }

      // Add rocket
      const rocket = document.createElement('div');
      rocket.className = 'rocket';
      rocket.textContent = '🚀';
      rocket.style.left = '80%';
      rocket.style.top = '60%';
      background.appendChild(rocket);

      container.appendChild(background);
    };

    addSpaceBackground();

    return () => {
      const background = document.querySelector('.space-background');
      if (background) background.remove();
    };
  }, []);

  // Get child's name from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem('childName') || localStorage.getItem('name');
    if (storedName) {
      setChildName(storedName);
    }
  }, []);

  return (
    <div className="child-dashboard">
      <div className="space-background"></div>
      <header className="dashboard-header">
        <h1 className="dashboard-welcome">🚀 Welcome, {childName}!</h1>
        <p className="dashboard-subtitle">Ready for your learning adventure? 🌟</p>
        <button onClick={handleLogout} className="logout-button">
          🚪 Logout
        </button>
      </header>

      {/* Activities section */}
      <h2 className="stats-title">🎮 Learning Activities</h2>
      <section className="activities-grid">
        <div className="activity-card" onClick={() => navigate("/math-quiz-levels")}>
          <span className="activity-icon">🧮</span>
          <h3>Math Game</h3>
          <p>Solve fun math problems! 5 levels with adaptive difficulty!</p>
          <button>🎯 Play Now</button>
        </div>
        
        <div className="activity-card" onClick={() => navigate("/english-quiz-levels")}>
          <span className="activity-icon">📚</span>
          <h3>English Game</h3>
          <p>Learn grammar, vocabulary, and spelling! 5 levels!</p>
          <button>📖 Play Now</button>
        </div>
        
        <div className="activity-card" onClick={() => navigate("/science-quiz-levels")}>
          <span className="activity-icon">🔬</span>
          <h3>Science Game</h3>
          <p>Explore the world of science! 5 levels!</p>
          <button>🔍 Play Now</button>
        </div>
        
        <div className="activity-card" onClick={() => navigate("/tricky-games-levels")}>
          <span className="activity-icon">🎲</span>
          <h3>Tricky Games</h3>
          <p>Brain teasers and puzzles! 5 levels!</p>
          <button>🧠 Play Now</button>
        </div>
      </section>
    </div>
  );
}
