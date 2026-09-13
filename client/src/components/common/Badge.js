import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default',
  className = '',
  style = {}
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    fontFamily: 'Comic Sans MS, Chalkboard SE, Arial Rounded MT Bold, sans-serif',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
    ...style
  };
  
  const variantStyles = {
    default: {
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      color: '#374151',
      border: '2px solid rgba(107, 114, 128, 0.3)'
    },
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: '2px solid rgba(102, 126, 234, 0.3)'
    },
    success: {
      background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
      color: 'white',
      border: '2px solid rgba(34, 197, 94, 0.3)'
    },
    warning: {
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      color: 'white',
      border: '2px solid rgba(245, 158, 11, 0.3)'
    },
    danger: {
      background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
      color: 'white',
      border: '2px solid rgba(220, 38, 38, 0.3)'
    }
  };

  const combinedStyles = {
    ...baseStyle,
    ...variantStyles[variant]
  };

  return (
    <span 
      className={className}
      style={combinedStyles}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-3px) scale(1.05)';
        e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0) scale(1)';
        e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)';
      }}
    >
      {children}
    </span>
  );
};

export default Badge;