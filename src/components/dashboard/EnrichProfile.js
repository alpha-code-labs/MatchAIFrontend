import React, { useState } from 'react';
import AIChatInterface from '../AIChatInterface';
import './EnrichProfile.css';

const EnrichProfile = ({ userProfile, onEnrichmentComplete }) => {
  const [showChat, setShowChat] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isEnrichmentComplete = userProfile?.isEnrichmentComplete || false;

  const handleChatNow = () => {
    setShowChat(true);
  };

  const handleChatClose = () => {
    setShowChat(false);
  };

  const handleEnrichmentDashboardOpen = (userData) => {
    setShowChat(false);
    setShowSuccessModal(true);
    
    // Auto close modal and refresh dashboard after 3 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
      if (onEnrichmentComplete) {
        onEnrichmentComplete(userData);
      }
    }, 3000);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    if (onEnrichmentComplete) {
      onEnrichmentComplete(userProfile);
    }
  };

  return (
    <>
      <div className="enrich-profile-section">
        <div className="enrich-header">
          <div className="enrich-icon">✨</div>
          <h2 className="enrich-title">Enrich Your Profile</h2>
        </div>

        <div className="enrich-content">
          {isEnrichmentComplete ? (
            <>
              <div className="enrichment-completed">
                <div className="completed-icon">🎉</div>
                <h3 className="completed-title">Profile Enrichment Complete!</h3>
                <p className="completed-description">
                  Fantastic! You've completed all additional questions and your personality profile 
                  has been enhanced with deeper insights. This will help us find even better matches for you!
                </p>
                <div className="completed-benefits">
                  <div className="benefit-item completed">
                    <span className="benefit-icon">✅</span>
                    <span className="benefit-text">Enhanced personality analysis completed</span>
                  </div>
                  <div className="benefit-item completed">
                    <span className="benefit-icon">✅</span>
                    <span className="benefit-text">Improved match accuracy activated</span>
                  </div>
                  <div className="benefit-item completed">
                    <span className="benefit-icon">✅</span>
                    <span className="benefit-text">Premium matching features unlocked</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="enrich-description">
                Ready to find even better matches? Chat with our AI to dive deeper into your personality, 
                preferences, and what makes you unique. The more we know about you, the better we can 
                find your perfect match!
              </p>

              <div className="enrich-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">🎯</span>
                  <span className="benefit-text">More accurate match recommendations</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">💡</span>
                  <span className="benefit-text">Deeper personality insights</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">💕</span>
                  <span className="benefit-text">Higher quality connections</span>
                </div>
              </div>

              <p className="enrich-note">
                Our AI will ask you additional thoughtful questions to better understand your values, 
                lifestyle, and relationship goals. This enhanced profile will help us find people who 
                truly complement your personality.
              </p>

              <button className="chat-now-button" onClick={handleChatNow}>
                <span className="button-icon">💬</span>
                Chat Now
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Chat Interface for Enrichment */}
      {showChat && (
        <AIChatInterface 
          onClose={handleChatClose}
          userProfile={userProfile}
          onDashboardOpen={handleEnrichmentDashboardOpen}
          startFromQuestion={9}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-content">
            <div className="success-modal-header">
              <div className="success-icon">🎉</div>
              <h2 className="success-title">Profile Enhanced Successfully!</h2>
            </div>

            <div className="success-modal-body">
              <p className="success-message">
                Amazing! Your personality profile has been enriched with deeper insights. 
                You'll now get even better match recommendations!
              </p>

              <div className="success-features">
                <div className="feature-item">
                  <span className="feature-icon">✨</span>
                  <span className="feature-text">Enhanced personality analysis</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🎯</span>
                  <span className="feature-text">Improved match accuracy</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💝</span>
                  <span className="feature-text">Higher quality connections</span>
                </div>
              </div>

              <div className="success-progress">
                <div className="progress-bar-success">
                  <div className="progress-fill-success"></div>
                </div>
                <p className="progress-text">Returning to dashboard...</p>
              </div>

              <button 
                className="success-close-button"
                onClick={handleSuccessModalClose}
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnrichProfile;