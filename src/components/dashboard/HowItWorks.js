import React from 'react';
import './HowItWorks.css';

const HowItWorks = ({ userProfile }) => {
  const getTimeZoneInfo = () => {
    // 6:00 AM IST conversions
    return {
      ist: '6:00 AM IST',
      est: '7:30 PM EST (Previous Day)', // IST is UTC+5:30, EST is UTC-5, so 6AM IST = 7:30PM EST previous day
      mst: '5:30 PM MST (Previous Day)', // MST is UTC-7, so 6AM IST = 5:30PM MST previous day
      pst: '4:30 PM PST (Previous Day)'  // PST is UTC-8, so 6AM IST = 4:30PM PST previous day
    };
  };

  const timeZones = getTimeZoneInfo();

  return (
    <div className="how-it-works-page-section">
      <div className="how-it-works-header">
        <h2 className="how-it-works-title">How It Works</h2>
        <div className="how-it-works-subtitle">
          <span className="algorithm-status">🎯 AI-Powered Matching System</span>
        </div>
      </div>

      <div className="how-it-works-content">
        {/* Main Description */}
        <div className="intro-section">
          <div className="intro-icon">💕</div>
          <h3 className="intro-title">Your Perfect Matches Are Generated Daily!</h3>
          <p className="intro-description">
            Our AI-powered matching algorithm is designed to find your ideal connections. 
            We run our sophisticated matching process once daily to ensure you get the highest quality matches.
          </p>
        </div>

        {/* Schedule Information */}
        <div className="schedule-info-card">
          <div className="schedule-header">
            <div className="schedule-icon">⏰</div>
            <h4 className="schedule-title">Daily Matching Schedule</h4>
          </div>
          
          <div className="schedule-content">
            <p className="schedule-description">
              Our matching algorithm runs automatically every day at:
            </p>
            
            <div className="timezone-grid">
              <div className="timezone-item primary">
                <div className="timezone-label">India (IST)</div>
                <div className="timezone-time">{timeZones.ist}</div>
              </div>
              
              <div className="timezone-item">
                <div className="timezone-label">US East (EST)</div>
                <div className="timezone-time">{timeZones.est}</div>
              </div>
              
              <div className="timezone-item">
                <div className="timezone-label">US Mountain (MST)</div>
                <div className="timezone-time">{timeZones.mst}</div>
              </div>
              
              <div className="timezone-item">
                <div className="timezone-label">US West (PST)</div>
                <div className="timezone-time">{timeZones.pst}</div>
              </div>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="process-steps-card">
          <div className="process-header">
            <div className="process-icon">✨</div>
            <h4 className="process-title">The Matching Process</h4>
          </div>
          
          <div className="process-content">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-text">
                <strong>Algorithm Runs:</strong> Our AI analyzes your personality and preferences against all other active users
              </div>
            </div>
            
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-text">
                <strong>Matches Generated:</strong> We find 3-5 highly compatible people for you based on your chosen algorithm
              </div>
            </div>
            
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-text">
                <strong>Email Notification:</strong> You'll receive an email letting you know your matches are ready
              </div>
            </div>
            
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-text">
                <strong>Start Connecting:</strong> Open the app, view your matches, and like the profiles you're interested in
              </div>
            </div>
          </div>
        </div>

        {/* Matching Algorithm Info */}
        <div className="algorithm-info-card">
          <div className="algorithm-header">
            <div className="algorithm-icon">🧠</div>
            <h4 className="algorithm-title">Your Current Matching Algorithm</h4>
          </div>
          
          <div className="algorithm-content">
            <div className="current-algorithm">
              {userProfile?.similarityMatching && (
                <div className="algorithm-badge similarity">
                  <span className="algorithm-emoji">🤝</span>
                  <span className="algorithm-name">Similarity Matching</span>
                  <span className="algorithm-description">Finding people with similar personalities and interests</span>
                </div>
              )}
              {userProfile?.complementaryMatching && (
                <div className="algorithm-badge complementary">
                  <span className="algorithm-emoji">🧲</span>
                  <span className="algorithm-name">Complementary Matching</span>
                  <span className="algorithm-description">Finding people with traits that balance and complement yours</span>
                </div>
              )}
              {userProfile?.multiDimensionalMatching && (
                <div className="algorithm-badge multidimensional">
                  <span className="algorithm-emoji">🎯</span>
                  <span className="algorithm-name">Multi-Dimensional Matching</span>
                  <span className="algorithm-description">Comprehensive analysis across multiple compatibility factors</span>
                </div>
              )}
              {userProfile?.dealBreakerFiltering && (
                <div className="algorithm-badge dealbreaker">
                  <span className="algorithm-emoji">🚫</span>
                  <span className="algorithm-name">Deal-Breaker Filtering</span>
                  <span className="algorithm-description">Filtering out incompatibilities first, then finding positive matches</span>
                </div>
              )}
            </div>
            <p className="algorithm-note">
              You can change your matching preference anytime in <strong>Match Settings</strong>.
            </p>
          </div>
        </div>

        {/* Why Daily Matching */}
        <div className="why-daily-card">
          <div className="why-daily-header">
            <div className="why-daily-icon">💡</div>
            <h4 className="why-daily-title">Why Daily Matching?</h4>
          </div>
          
          <div className="why-daily-content">
            <div className="benefit-item">
              <div className="benefit-icon">🎯</div>
              <div className="benefit-text">
                <strong>Quality over Quantity:</strong> Curated daily selection means better, more thoughtful matches
              </div>
            </div>
            
            <div className="benefit-item">
              <div className="benefit-icon">🧠</div>
              <div className="benefit-text">
                <strong>Fresh Analysis:</strong> Daily processing incorporates the latest user activities and preferences
              </div>
            </div>
            
            <div className="benefit-item">
              <div className="benefit-icon">⚡</div>
              <div className="benefit-text">
                <strong>Optimal Performance:</strong> Scheduled processing ensures fast, reliable matching for everyone
              </div>
            </div>
            
            <div className="benefit-item">
              <div className="benefit-icon">💝</div>
              <div className="benefit-text">
                <strong>Anticipation:</strong> Daily matches create excitement and encourage regular app engagement
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;