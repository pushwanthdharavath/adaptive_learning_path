import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  title = '',
  style = {},
  ...props 
}) => {
  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
    borderRadius: '30px',
    padding: '30px',
    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.2)',
    border: '4px solid rgba(102, 126, 234, 0.3)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    fontFamily: 'Comic Sans MS, Chalkboard SE, Arial Rounded MT Bold, sans-serif',
    ...style
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '20px',
    textAlign: 'center',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div 
      className={className}
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.3)';
        e.currentTarget.style.borderColor = '#667eea';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.2)';
        e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
      }}
      {...props}
    >
      {title && <h3 style={titleStyle}>{title}</h3>}
      {children}
    </div>
  );
};

export default Card;