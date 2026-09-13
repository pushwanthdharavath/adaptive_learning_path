import React from 'react';

const ProgressBar = ({ 
  progress = 0, 
  color = 'blue',
  height = 12,
  showLabel = false,
  className = '',
  style = {}
}) => {
  const colorStyles = {
    blue: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    green: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
    yellow: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
    red: 'linear-gradient(90deg, #f87171 0%, #dc2626 100%)',
    purple: 'linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%)'
  };

  const percentage = Math.min(100, Math.max(0, progress));

  const containerStyle = {
    width: '100%',
    fontFamily: 'Comic Sans MS, Chalkboard SE, Arial Rounded MT Bold, sans-serif',
    ...style
  };

  const labelStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#667eea'
  };

  const barContainerStyle = {
    width: '100%',
    height: `${height}px`,
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: `${height / 2}px`,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    border: '3px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
  };

  const fillStyle = {
    height: '100%',
    background: colorStyles[color],
    borderRadius: `${height / 2}px`,
    transition: 'width 0.5s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.5)'
  };

  return (
    <div className={className} style={containerStyle}>
      {showLabel && (
        <div style={labelStyle}>
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div style={barContainerStyle}>
        <div 
          style={{
            ...fillStyle,
            width: `${percentage}%`
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;