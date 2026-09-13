import React from 'react';

const Input = ({ 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  className = '',
  style = {},
  ...props 
}) => {
  const inputStyle = {
    width: '100%',
    padding: '15px 20px',
    border: '3px solid rgba(102, 126, 234, 0.3)',
    borderRadius: '25px',
    fontSize: '16px',
    fontFamily: 'Comic Sans MS, Chalkboard SE, Arial Rounded MT Bold, sans-serif',
    outline: 'none',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    ...style
  };

  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={className}
      style={inputStyle}
      onFocus={(e) => {
        e.target.style.borderColor = '#667eea';
        e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
        e.target.style.transform = 'scale(1.02)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'rgba(102, 126, 234, 0.3)';
        e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        e.target.style.transform = 'scale(1)';
      }}
      {...props}
    />
  );
};

export default Input;