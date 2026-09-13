import React from "react";

const TextInput = ({
  value,
  handleInputChange,
  type,
  hint,
  label,
  placeholder,
  name,
  className = '',
}) => {
  return (
    <div className={`game-card ${className}`}>
      <label className="welcome-title">{label || ""}</label>
      <input
        name={name}
        type={type || "text"}
        className="play-button"
        placeholder={placeholder || ""}
        value={value}
        onChange={handleInputChange}
      />
      <p className="subtitle">{hint}</p>
    </div>
  );
};

export default TextInput;