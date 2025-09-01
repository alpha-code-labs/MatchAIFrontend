import React, { useState } from 'react';
import './PersonalityAnalysis.css';

const PersonalityAnalysis = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const personalityAnalysis = userProfile?.personalityAnalysis;

  // If no personality analysis available
  if (!personalityAnalysis) {
    return (
      <div className="personality-analysis-empty-state">
        <div className="empty-state-icon">🧠</div>
        <h3 className="empty-state-title">No Personality Analysis Available</h3>
        <p className="empty-state-message">
          Complete the personality assessment to view your detailed analysis here.
        </p>
        <div className="empty-state-cta">
          <div className="cta-icon">✨</div>
          <p>Take the assessment to unlock insights about your personality, relationship style, and compatibility factors!</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '👤',
      description: 'Core personality traits'
    },
    {
      id: 'relationship',
      label: 'Relationship Style',
      icon: '💕',
      description: 'How you connect with others'
    },
    {
      id: 'compatibility',
      label: 'Compatibility',
      icon: '🎯',
      description: 'What you need in a partner'
    },
    {
      id: 'scores',
      label: 'Personality Scores',
      icon: '📊',
      description: 'Big Five personality metrics'
    },
    {
      id: 'insights',
      label: 'Matching Insights',
      icon: '💡',
      description: 'AI-powered relationship advice'
    }
  ];

  const renderOverviewTab = () => (
    <div className="tab-content overview-tab">
      <div className="overview-grid">
        <div className="overview-card primary-traits">
          <div className="card-header">
            <div className="card-icon">🌟</div>
            <h3 className="card-title">Primary Traits</h3>
          </div>
          <div className="traits-list">
            {personalityAnalysis.corePersonality?.primaryTraits?.map((trait, index) => (
              <div key={index} className="trait-item">
                <div className="trait-bullet">✓</div>
                <span className="trait-text">{trait}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card strengths">
          <div className="card-header">
            <div className="card-icon">💪</div>
            <h3 className="card-title">Key Strengths</h3>
          </div>
          <div className="strengths-list">
            {personalityAnalysis.corePersonality?.strengths?.map((strength, index) => (
              <div key={index} className="strength-item">
                <div className="strength-bullet">⭐</div>
                <span className="strength-text">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card preferences">
          <div className="card-header">
            <div className="card-icon">🎯</div>
            <h3 className="card-title">Preferences</h3>
          </div>
          <div className="preferences-list">
            {personalityAnalysis.corePersonality?.preferences?.map((preference, index) => (
              <div key={index} className="preference-item">
                <div className="preference-bullet">💜</div>
                <span className="preference-text">{preference}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRelationshipTab = () => (
    <div className="tab-content relationship-tab">
      <div className="relationship-grid">
        <div className="relationship-card attachment-style">
          <div className="card-header">
            <div className="card-icon">🔗</div>
            <h3 className="card-title">Attachment Style</h3>
          </div>
          <div className="attachment-content">
            <div className="attachment-type">
              {personalityAnalysis.relationshipStyle?.attachmentStyle}
            </div>
            <div className="attachment-description">
              Your attachment style influences how you form and maintain emotional bonds in relationships.
            </div>
          </div>
        </div>

        <div className="relationship-card communication-style">
          <div className="card-header">
            <div className="card-icon">💬</div>
            <h3 className="card-title">Communication Style</h3>
          </div>
          <div className="communication-content">
            <p className="communication-description">
              {personalityAnalysis.relationshipStyle?.communicationStyle}
            </p>
          </div>
        </div>

        <div className="relationship-card conflict-resolution">
          <div className="card-header">
            <div className="card-icon">🤝</div>
            <h3 className="card-title">Conflict Resolution</h3>
          </div>
          <div className="conflict-content">
            <p className="conflict-description">
              {personalityAnalysis.relationshipStyle?.conflictResolution}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompatibilityTab = () => (
    <div className="tab-content compatibility-tab">
      <div className="compatibility-grid">
        <div className="compatibility-card deal-breakers">
          <div className="card-header">
            <div className="card-icon">🚫</div>
            <h3 className="card-title">Deal Breakers</h3>
            <p className="card-subtitle">Things you cannot compromise on</p>
          </div>
          <div className="deal-breakers-list">
            {personalityAnalysis.compatibilityFactors?.dealBreakers?.map((dealBreaker, index) => (
              <div key={index} className="deal-breaker-item">
                <div className="deal-breaker-bullet">❌</div>
                <span className="deal-breaker-text">{dealBreaker}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="compatibility-card must-haves">
          <div className="card-header">
            <div className="card-icon">✅</div>
            <h3 className="card-title">Must Haves</h3>
            <p className="card-subtitle">Essential qualities you seek</p>
          </div>
          <div className="must-haves-list">
            {personalityAnalysis.compatibilityFactors?.mustHaves?.map((mustHave, index) => (
              <div key={index} className="must-have-item">
                <div className="must-have-bullet">💎</div>
                <span className="must-have-text">{mustHave}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="compatibility-card flexible-areas">
          <div className="card-header">
            <div className="card-icon">🤲</div>
            <h3 className="card-title">Flexible Areas</h3>
            <p className="card-subtitle">Where you can be adaptable</p>
          </div>
          <div className="flexible-areas-list">
            {personalityAnalysis.compatibilityFactors?.flexibleAreas?.map((flexibleArea, index) => (
              <div key={index} className="flexible-area-item">
                <div className="flexible-area-bullet">🌟</div>
                <span className="flexible-area-text">{flexibleArea}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderScoresTab = () => {
    const scores = personalityAnalysis.personalityScore || {};
    const scoreItems = [
      { key: 'openness', label: 'Openness', description: 'Curiosity and willingness to try new experiences', color: '#8b5cf6' },
      { key: 'conscientiousness', label: 'Conscientiousness', description: 'Organization and attention to detail', color: '#059669' },
      { key: 'extraversion', label: 'Extraversion', description: 'Energy from social interaction', color: '#dc2626' },
      { key: 'agreeableness', label: 'Agreeableness', description: 'Cooperation and trust in others', color: '#2563eb' },
      { key: 'neuroticism', label: 'Neuroticism', description: 'Emotional stability and stress management', color: '#ea580c' }
    ];

    return (
      <div className="tab-content scores-tab">
        <div className="scores-header">
          <h3 className="scores-title">Big Five Personality Dimensions</h3>
          <p className="scores-subtitle">Your personality scores on the scientifically validated Big Five model</p>
        </div>
        <div className="scores-grid">
          {scoreItems.map((item, index) => {
            const score = scores[item.key] || 0;
            const percentage = Math.max(0, Math.min(100, score));
            
            return (
              <div key={index} className="score-card">
                <div className="score-header">
                  <h4 className="score-label">{item.label}</h4>
                  <div className="score-value" style={{ color: item.color }}>
                    {score}/100
                  </div>
                </div>
                <div className="score-bar-container">
                  <div className="score-bar-background">
                    <div 
                      className="score-bar-fill"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                  <div className="score-percentage">{percentage}%</div>
                </div>
                <p className="score-description">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderInsightsTab = () => (
    <div className="tab-content insights-tab">
      <div className="insights-grid">
        <div className="insights-card ideal-partner">
          <div className="card-header">
            <div className="card-icon">💝</div>
            <h3 className="card-title">Your Ideal Partner Type</h3>
          </div>
          <div className="ideal-partner-content">
            <p className="ideal-partner-description">
              {personalityAnalysis.matchingInsights?.idealPartnerType}
            </p>
          </div>
        </div>

        <div className="insights-card compatibility-predictors">
          <div className="card-header">
            <div className="card-icon">🔮</div>
            <h3 className="card-title">Compatibility Predictors</h3>
          </div>
          <div className="predictors-list">
            {personalityAnalysis.matchingInsights?.compatibilityPredictors?.map((predictor, index) => (
              <div key={index} className="predictor-item">
                <div className="predictor-bullet">🎯</div>
                <span className="predictor-text">{predictor}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="insights-card relationship-advice">
          <div className="card-header">
            <div className="card-icon">💡</div>
            <h3 className="card-title">Relationship Advice</h3>
          </div>
          <div className="advice-content">
            <p className="advice-description">
              {personalityAnalysis.matchingInsights?.relationshipAdvice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'relationship':
        return renderRelationshipTab();
      case 'compatibility':
        return renderCompatibilityTab();
      case 'scores':
        return renderScoresTab();
      case 'insights':
        return renderInsightsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="personality-analysis-page-section">
      {/* Header */}
      <div className="personality-analysis-header">
        <div className="header-content">
          <h2 className="analysis-title">Your Personality Analysis</h2>
          <div className="analysis-subtitle">
            <span className="analysis-status">✅ Analysis Complete</span>
          </div>
        </div>
        <div className="analysis-badge">
          <div className="badge-icon">🧠</div>
          <div className="badge-text">AI-Powered Analysis</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="tab-icon">{tab.icon}</div>
              <div className="tab-content-info">
                <div className="tab-label">{tab.label}</div>
                <div className="tab-description">{tab.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content-container">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PersonalityAnalysis;