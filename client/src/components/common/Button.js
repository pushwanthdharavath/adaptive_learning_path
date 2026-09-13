import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  className = '', 
  disabled = false,
  variant = 'primary',
  style = {}
}) => {
  const baseStyles = {
    padding: '12px 24px',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: 'bold',
    fontFamily: 'Comic Sans MS, Chalkboard SE, Arial Rounded MT Bold, sans-serif',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    border: 'none',
    outline: 'none',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
    ...style
  };
  
  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: '3px solid rgba(102, 126, 234, 0.3)'
    },
    secondary: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
      color: '#667eea',
      border: '3px solid rgba(102, 126, 234, 0.3)'
    },
    danger: {
      background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
      color: 'white',
      border: '3px solid rgba(220, 38, 38, 0.3)'
    },
    success: {
      background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
      color: 'white',
      border: '3px solid rgba(34, 197, 94, 0.3)'
    }
  };

  const disabledStyles = {
    opacity: '0.5',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none'
  };

  const hoverStyles = disabled ? {} : {
    ':hover': {
      transform: 'translateY(-5px) scale(1.05)',
      boxShadow: '0 12px 35px rgba(0, 0, 0, 0.3)'
    }
  };

  const combinedStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...(disabled ? disabledStyles : {}),
    ...style
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={combinedStyles}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.transform = 'translateY(-5px) scale(1.05)';
          e.target.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
        }
      }}
    >
      {children}
    </button>
  );
};

export default Button;