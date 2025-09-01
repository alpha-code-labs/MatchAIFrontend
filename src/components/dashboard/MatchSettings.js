import React, { useState } from 'react';
import './MatchSettings.css';
import ErrorModal from '../ErrorModal';

const MatchSettings = ({ userProfile, onMatchSettingsUpdate }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [matchingAlgorithms, setMatchingAlgorithms] = useState({
    similarityMatching: userProfile?.similarityMatching || false,
    complementaryMatching: userProfile?.complementaryMatching || false,
    multiDimensionalMatching: userProfile?.multiDimensionalMatching || false,
    dealBreakerFiltering: userProfile?.dealBreakerFiltering || false
  });

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Just close the error modal, user stays on the current page
  };

  const handleLockToggle = () => {
    setIsLocked(!isLocked);
  };

  const handleAlgorithmChange = (algorithmType) => {
    if (isLocked) return;

    // Set all to false, then set the selected one to true (radio button behavior)
    const newAlgorithms = {
      similarityMatching: false,
      complementaryMatching: false,  
      multiDimensionalMatching: false,
      dealBreakerFiltering: false
    };
    
    newAlgorithms[algorithmType] = true;
    setMatchingAlgorithms(newAlgorithms);
  };

  const handleSubmit = async () => {
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/match-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userProfile.email,
          ...matchingAlgorithms
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local state with server response
      const updatedUser = result.data.user;
      
      setMatchingAlgorithms({
        similarityMatching: updatedUser.similarityMatching || false,
        complementaryMatching: updatedUser.complementaryMatching || false,
        multiDimensionalMatching: updatedUser.multiDimensionalMatching || false,
        dealBreakerFiltering: updatedUser.dealBreakerFiltering || false
      });
      
      // Lock the form after successful update
      setIsLocked(true);
      
      // CRITICAL: Notify parent components about the update
      if (onMatchSettingsUpdate) {
        onMatchSettingsUpdate(updatedUser);
      } else {
        console.error('❌ MatchSettings: onMatchSettingsUpdate callback not provided');
      }

    } catch (error) {
      console.error('❌ Match settings update failed:', error);
      setShowServerError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchingOptions = [
    {
      key: 'similarityMatching',
      title: 'Similarity Matching',
      description: 'Find matches with similar personalities, values, interests, and life goals. Perfect for building harmonious relationships based on shared understanding.',
      icon: '🤝',
      pros: ['High compatibility', 'Shared interests', 'Easy communication', 'Similar life goals']
    },
    {
      key: 'complementaryMatching', 
      title: 'Complementary Matching',
      description: 'Find matches with opposite but complementary traits that balance each other out. Ideal for those who believe differences create stronger partnerships.',
      icon: '🧲',
      pros: ['Balanced dynamics', 'Mutual growth', 'Exciting differences', 'Complementary strengths']
    },
    {
      key: 'multiDimensionalMatching',
      title: 'Multi-Dimensional Matching',
      description: 'Find matches using advanced analysis across multiple personality dimensions, values, and compatibility factors for the most comprehensive matching.',
      icon: '🎯',
      pros: ['Comprehensive analysis', 'Multiple compatibility factors', 'Sophisticated matching', 'Well-rounded connections']
    },
    {
      key: 'dealBreakerFiltering',
      title: 'Deal-Breaker Filtering',
      description: 'Find matches by first filtering out incompatible traits and deal-breakers, then focusing on positive compatibility factors among remaining candidates.',
      icon: '🚫',
      pros: ['Eliminates incompatibilities', 'Focuses on essentials', 'Time-efficient', 'Higher success rate']
    }
  ];

  // Loading Screen
  if (isSubmitting) {
    return (
      <div className="match-settings-loading-overlay">
        <div className="match-settings-loading-container">
          <div className="match-settings-loading-content">
            <div className="match-settings-loading-icon">🎯</div>
            <h2 className="match-settings-loading-title">Updating Your Matching Algorithm</h2>
            <p className="match-settings-loading-message">
              We're optimizing your matching preferences to help you find the perfect connections!
            </p>
            <div className="match-settings-loading-progress">
              <div className="match-settings-progress-bar">
                <div className="match-settings-progress-fill"></div>
              </div>
              <div className="match-settings-progress-steps">
                <div className="match-settings-progress-step active">
                  <div className="match-settings-step-icon">⚙️</div>
                  <span>Updating Algorithm</span>
                </div>
                <div className="match-settings-progress-step active">
                  <div className="match-settings-step-icon">🎯</div>
                  <span>Optimizing Matches</span>
                </div>
                <div className="match-settings-progress-step">
                  <div className="match-settings-step-icon">✅</div>
                  <span>Complete</span>
                </div>
              </div>
            </div>
            <div className="match-settings-loading-spinner">
              <div className="match-settings-spinner-ring"></div>
              <div className="match-settings-spinner-ring"></div>
              <div className="match-settings-spinner-ring"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="match-settings-page-section">
      {/* Header with Lock/Unlock */}
      <div className="match-settings-header">
        <h2 className="match-settings-title">Match Settings</h2>
        <button 
          className={`lock-button ${isLocked ? 'locked' : 'unlocked'}`}
          onClick={handleLockToggle}
          title={isLocked ? 'Click to edit matching algorithm' : 'Click to lock matching algorithm'}
        >
          {isLocked ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10A2,2 0 0,1 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18Z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Matching Algorithm Section */}
      <div className="match-settings-algorithm-section">
        <h3 className="section-title">Choose Your Matching Algorithm</h3>
        <p className="section-subtitle">
          Select one algorithm that best describes how you'd like our AI to find your perfect matches. 
          Each algorithm uses different approaches to compatibility analysis.
        </p>
        
        <div className="matching-options-grid">
          {matchingOptions.map((option) => (
            <div 
              key={option.key}
              className={`matching-option-card ${matchingAlgorithms[option.key] ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => handleAlgorithmChange(option.key)}
            >
              <div className="matching-option-header">
                <div className="matching-option-icon">{option.icon}</div>
                <div className="matching-option-toggle">
                  <div className={`radio-button ${matchingAlgorithms[option.key] ? 'active' : ''}`}>
                    {matchingAlgorithms[option.key] && (
                      <div className="radio-button-dot"></div>
                    )}
                  </div>
                </div>
              </div>
              <h4 className="matching-option-title">{option.title}</h4>
              <p className="matching-option-description">{option.description}</p>
              
              <div className="matching-option-pros">
                <h5 className="pros-title">Key Benefits:</h5>
                <ul className="pros-list">
                  {option.pros.map((pro, index) => (
                    <li key={index} className="pros-item">
                      <span className="pros-bullet">✓</span>
                      <span className="pros-text">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      {!isLocked && (
        <div className="match-settings-submit-section">
          <button className="match-settings-submit-button" onClick={handleSubmit}>
            <span className="button-icon">🎯</span>
            Save Matching Algorithm
          </button>
        </div>
      )}

      <ErrorModal 
        isOpen={showServerError} 
        onOkClick={handleErrorOkClick}
      />
    </div>
  );
};

export default MatchSettings;