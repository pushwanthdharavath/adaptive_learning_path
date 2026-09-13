import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Signup.css";

const Signup = () => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("parent");
  const [parentId, setParentId] = useState("");
  const [generatedParentId, setGeneratedParentId] = useState("");
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Add animated background particles
  useEffect(() => {
    const addBackgroundParticles = () => {
      const container = document.querySelector('.signup-container');
      if (!container || document.querySelector('.background-particles')) return;

      const particles = document.createElement('div');
      particles.className = 'background-particles';
      
      const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
      for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'bg-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.animationDuration = (8 + Math.random() * 4) + 's';
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const payload = {
        name,
        email,
        password,
        role
      };

      // Add child-specific fields
      if (role === "child") {
        payload.age = age;
        payload.gender = gender;
        if (parentId) {
          payload.parentId = parentId;
        }
      }

      const response = await axios.post(
        "http://localhost:5000/api/auth/signup",
        payload
      );

      if (role === "parent" && response.data.parentId) {
        setGeneratedParentId(response.data.parentId);
      } else {
        alert(response.data.message || "Signup successful!");
        navigate("/login");
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data?.message || "Signup failed! Please check your information.");
      } else if (error.request) {
        setErrorMessage("No response from server. Please check your connection and try again.");
      } else {
        setErrorMessage("An error occurred during signup. Please try again later.");
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="background-particles"></div>
      
      {/* Decorative elements */}
      <div className="decorative-star" style={{top: '8%', left: '12%'}}>⭐</div>
      <div className="decorative-star" style={{top: '25%', right: '18%'}}>✨</div>
      <div className="decorative-star" style={{bottom: '12%', left: '20%'}}>🌟</div>
      <div className="decorative-star" style={{bottom: '25%', right: '15%'}}>💫</div>
      
      <div className="signup-card">
        <div className="signup-header">
          <div className="signup-logo">🚀</div>
          <h1 className="signup-title">Join the Adventure!</h1>
          <p className="signup-subtitle">Create your account and start exploring! 🌟</p>
        </div>
        
        {errorMessage && (
          <div className="error-message">🚫 {errorMessage}</div>
        )}
        
        <form onSubmit={handleSignup} className="signup-form">
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">Who are you? 🤔</label>
            <div className="radio-group">
              <label className="radio-option">
                <input 
                  type="radio" 
                  name="role" 
                  value="parent" 
                  checked={role === "parent"} 
                  onChange={() => setRole("parent")} 
                /> 
                <span>Parent 👨‍👩‍👧‍👦</span>
              </label>
              <label className="radio-option">
                <input 
                  type="radio" 
                  name="role" 
                  value="child" 
                  checked={role === "child"} 
                  onChange={() => setRole("child")} 
                /> 
                <span>Kid 🧒</span>
              </label>
            </div>
            
            {role === "parent" && (
              <p className="role-helper-text">🎁 You'll get a special Parent ID to share with your kids!</p>
            )}
          </div>

          {/* Parent-specific fields */}
          {role === "parent" && (
            <>
              <div className="input-group">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  placeholder="Your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="signup-input"
                />
              </div>
              
              <div className="input-group">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  placeholder="Your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="signup-input"
                />
              </div>
              
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  placeholder="Your secret password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="signup-input"
                />
              </div>
            </>
          )}

          {/* Child-specific fields */}
          {role === "child" && (
            <>
              <div className="form-row">
                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    placeholder="Your awesome name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="signup-input"
                  />
                </div>

                <div className="input-group">
                  <span className="input-icon">🎂</span>
                  <input
                    type="number"
                    placeholder="Your age"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="signup-input"
                  />
                </div>
              </div>

              <div className="input-group">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  placeholder="Your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="signup-input"
                />
              </div>

              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  placeholder="Your secret password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="signup-input"
                />
              </div>

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="signup-select"
              >
                <option value="male">Boy 👦</option>
                <option value="female">Girl 👧</option>
                <option value="other">Other 🌈</option>
              </select>

              <div className="input-group">
                <span className="input-icon">🔑</span>
                <input
                  type="text"
                  placeholder="Ask your parent for their ID"
                  required
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="signup-input"
                />
              </div>
            </>
          )}
          
          <button type="submit" className="signup-button">
            🎮 Let's Start the Adventure!
          </button>
        </form>

        {generatedParentId && role === "parent" && (
          <div className="success-message">
            <h3>🎉 Account Created Successfully!</h3>
            <div className="parent-id-label">🔑 Your Special Parent ID:</div>
            <div className="parent-id">{generatedParentId}</div>
            <p>Save this ID to connect your child's account! 🌟</p>
          </div>
        )}
        
        <p className="signup-footer">
          Already an explorer? <Link to="/login" className="signup-link">Login Here! 🚀</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
