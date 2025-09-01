import React from 'react';
import './ErrorModal.css';

const ErrorModal = ({ isOpen, onOkClick }) => {
  if (!isOpen) return null;

  return (
    <div className="error-modal-overlay">
      <div className="error-modal-container">
        <div className="error-modal-icon">⚠️</div>
        <h2 className="error-modal-title">Server Error</h2>
        <p className="error-modal-message">
          Our MatchAI Servers are down. Please try again later.
        </p>
        <button className="error-modal-ok-button" onClick={onOkClick}>
          OK
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;