import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import "../styles/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Add animated background particles
  useEffect(() => {
    const addBackgroundParticles = () => {
      const container = document.querySelector('.login-container');
      if (!container || document.querySelector('.background-particles')) return;

      const particles = document.createElement('div');
      particles.className = 'background-particles';
      
      const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'bg-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (6 + Math.random() * 4) + 's';
        particles.appendChild(particle);
      }
      
      container.appendChild(particles);
    };
    
    addBackgroundParticles();
    
    return () => {
      const particles = document.querySelector('.background-particles');
      if (particles) particles.remove();
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const response = await api.post("/api/auth/login", formData);
      
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      
      if (response.data.name) {
        localStorage.setItem("name", response.data.name);
      }
      
      if (response.data.userId) {
        localStorage.setItem("userId", response.data.userId);
      }
      
      if (response.data.parentId) {
        localStorage.setItem("parentId", response.data.parentId);
      }

      if (response.data.parentCode) {
        localStorage.setItem("parentCode", response.data.parentCode);
      }

      if (response.data.role === "parent") {
        localStorage.setItem("parentName", response.data.name);
        navigate("/parent-dashboard");
      } else if (response.data.role === "child") {
        localStorage.setItem("childName", response.data.name);
        navigate("/child-dashboard");
      } else if (response.data.role === "teacher" || response.data.role === "therapist") {
        localStorage.setItem("teacherName", response.data.name);
        navigate("/teacher-dashboard");
      } else {
        navigate(`/${response.data.role}-dashboard`);
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data?.message || "Invalid credentials, please try again.");
      } else if (error.request) {
        setErrorMessage("No response from server. Please check your connection and try again.");
      } else {
        setErrorMessage("An error occurred during login. Please try again later.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="background-particles"></div>
      
      {/* Decorative elements */}
      <div className="decorative-star" style={{top: '10%', left: '15%'}}>⭐</div>
      <div className="decorative-star" style={{top: '20%', right: '20%'}}>✨</div>
      <div className="decorative-star" style={{bottom: '15%', left: '25%'}}>🌟</div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🚀</div>
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtitle">Ready for your adventure? 🌟</p>
        </div>
        
        {errorMessage && (
          <div className="error-message">🚫 {errorMessage}</div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <span className="input-icon">📧</span>
            <input
              type="text"
              name="email"
              placeholder="Email or username"
              required
              value={formData.email}
              onChange={handleChange}
              className="login-input"
            />
          </div>
          
          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              name="password"
              placeholder="Your secret password"
              required
              value={formData.password}
              onChange={handleChange}
              className="login-input"
            />
          </div>
          
          <div className="remember-me">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            <label htmlFor="rememberMe">Remember me 🧠</label>
          </div>
          
          <button type="submit" className="login-button">
            🎮 Let's Play!
          </button>
        </form>
        
        <p className="login-footer">
          New explorer? <Link to="/signup" className="login-link">Join the Adventure! 🚀</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
