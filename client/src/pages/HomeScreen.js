import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/HomeScreenStyles.css";

const HomeScreen = () => {
  // Add floating particles animation
  useEffect(() => {
    const addAnimatedParticles = () => {
      const particles = document.createElement('div');
      particles.className = 'particles';
      
      // Create 15 colorful particles
      const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
      for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        particles.appendChild(particle);
      }
      
      // Add particles to container
      const container = document.querySelector('.home-screen');
      if (container && !document.querySelector('.particles')) {
        container.appendChild(particles);
      }
    };
    
    addAnimatedParticles();
    
    // Cleanup
    return () => {
      const particles = document.querySelector('.particles');
      if (particles) {
        particles.remove();
      }
    };
  }, []);
  
  return (
    <div className="home-screen">
      <div className="particles"></div>
      
      {/* Decorative elements */}
      <div className="star" style={{top: '10%', left: '20%'}}>⭐</div>
      <div className="star" style={{top: '30%', right: '15%'}}>✨</div>
      <div className="star" style={{bottom: '20%', left: '10%'}}>🌟</div>
      <div className="rocket" style={{top: '15%', right: '25%'}}>🚀</div>
      <div className="planet" style={{bottom: '30%', right: '20%'}}>�</div>
      
      <div className="hero-section">
        <div className="logo">🚀</div>
        <h1 className="hero-title">Adaptive Learning Path!</h1>
        <p className="hero-subtitle">
          Discover a world of fun learning! 🌟<br/>
          Play games, solve puzzles, and explore while you learn!
        </p>
        
        <div className="feature-cards">
          <div className="feature-card">
            <span className="feature-icon">🎮</span>
            <h3 className="feature-title">Fun Games</h3>
            <p className="feature-description">Play exciting math and puzzle games that adapt to your learning level!</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">🎯</span>
            <h3 className="feature-title">Learn & Grow</h3>
            <p className="feature-description">Track your progress and earn badges as you complete challenges!</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">🤖</span>
            <h3 className="feature-title">Smart Learning</h3>
            <p className="feature-description">Our system understands how you feel and adjusts to help you learn better!</p>
          </div>
        </div>
        
        <div className="cta-buttons">
          <Link to="/login" className="cta-button primary">
            🎮 Start Playing!
          </Link>
          <Link to="/signup" className="cta-button secondary">
            🚀 Join the Adventure!
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
