import React, { useEffect, useState, useRef, useCallback } from 'react';
import BasicInfoForm from '../components/BasicInfoForm';
import AIChatInterface from '../components/AIChatInterface';
import Dashboard from '../components/Dashboard';
import ErrorModal from '../components/ErrorModal';
import './LandingPage.css';

const LandingPage = () => {
  const [particles, setParticles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showNoAccountModal, setShowNoAccountModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [completeUserData, setCompleteUserData] = useState(null);
  const [matchesData, setMatchesData] = useState(null); // NEW: Store matches data
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInErrors, setSignInErrors] = useState({});
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const googleSignInButtonRef = useRef(null);

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Just close the error modal, user stays on the current page
  };

  // Check for auto-login user data on component mount
  useEffect(() => {
    const checkForAutoLogin = () => {
      
      try {
        const storedProfile = localStorage.getItem('userProfile');
        const storedMatches = localStorage.getItem('matchesData'); // NEW: Check for stored matches
        
        if (storedProfile) {
          const userData = JSON.parse(storedProfile);
          
          // Set user profile state
          setUserProfile(userData);
          
          // Check for stored matches data
          if (storedMatches) {
            try {
              const matchesData = JSON.parse(storedMatches);
              setMatchesData(matchesData);
              // Clear stored matches after loading (they're for one-time notification)
              localStorage.removeItem('matchesData');
            } catch (matchParseError) {
              console.warn('⚠️ Failed to parse stored matches data:', matchParseError);
              localStorage.removeItem('matchesData');
            }
          }
          
          // If user has completed analysis, show dashboard
          if (userData.isAnalysisComplete && userData.personalityAnalysis) {
            setCompleteUserData(userData);
            setShowDashboard(true);
          } 
        } 
      } catch (error) {
        console.error('❌ Error parsing stored user profile:', error);
        // Clear invalid stored data
        localStorage.removeItem('userProfile');
        localStorage.removeItem('authToken');
        localStorage.removeItem('matchesData');
      }
    };

    // Run the check
    checkForAutoLogin();
  }, []); // Empty dependency array - only run on mount

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          delay: Math.random() * 5,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  // Google Sign-In Handler for Sign In Modal
  const handleGoogleSignIn = useCallback((response) => {
    try {
      
      const decoded = JSON.parse(atob(response.credential.split('.')[1]));
      
      // Auto-fill email if available
      if (decoded.email) {
        setSignInEmail(decoded.email);
      }
      
      
    } catch (error) {
      console.error('Error processing Google sign-in:', error);
      console.error('❌ There was an error signing in with Google. Please try again.');
    }
  }, []);

  // Load Google Sign-In Script
  useEffect(() => {
    const loadGoogleScript = () => {
      return new Promise((resolve, reject) => {
        if (window.google) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadGoogleScript()
      .then(() => {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          setIsGoogleLoaded(true);
        }
      })
      .catch((error) => {
        console.error('Failed to load Google Sign-In script:', error);
      });
  }, [handleGoogleSignIn]);

  // Render Google Button for Sign In Modal
  useEffect(() => {
    if (isGoogleLoaded && googleSignInButtonRef.current && showSignInModal) {
      googleSignInButtonRef.current.innerHTML = '';
      
      window.google.accounts.id.renderButton(googleSignInButtonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        width: '100%',
        logo_alignment: 'left',
      });
    }
  }, [isGoogleLoaded, showSignInModal]);

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const message = encodeURIComponent(`Check out Match.AI - the future of dating! ${url}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleLogout = () => {
    
    // Clear localStorage (for auto-login data)
    localStorage.removeItem('userProfile');
    localStorage.removeItem('authToken');
    localStorage.removeItem('matchesData'); // NEW: Clear matches data
    
    // Clear all user data and states
    setUserProfile(null);
    setCompleteUserData(null);
    setMatchesData(null); // NEW: Clear matches state
    setShowDashboard(false);
    setShowChat(false);
    setShowForm(false);
    setShowSignInModal(false);
    setShowNoAccountModal(false);
    setSignInEmail('');
    setSignInErrors({});
    
  };

  const handleTryNow = () => {
    if (userProfile) {
      // User is signed in - show chat interface
      setShowChat(true);
    } else {
      // User not signed in - show registration form
      setShowForm(true);
    }
  };

  const handleSignInClick = () => {
    setShowSignInModal(true);
    setSignInEmail('');
    setSignInErrors({});
  };

  const handleSignInSubmit = async () => {
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signInEmail || !emailRegex.test(signInEmail)) {
      setSignInErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    // Clear errors and start loading
    setSignInErrors({});
    setIsSigningIn(true);
    
    try {
      
      // Make API call to backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signInEmail
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Check if user was found
      if (result.data && result.data.user) {
        // User found - extract user data and matches
        const userData = result.data.user;
        const matchesData = result.data.matches; // NEW: Extract matches data
        
        setUserProfile(userData);
        setShowSignInModal(false);
        setSignInEmail('');
        
        // Store user data in localStorage for persistence
        localStorage.setItem('userProfile', JSON.stringify(userData));
        localStorage.setItem('authToken', 'authenticated');
        
        // Store matches data if present
        if (matchesData && matchesData.totalCount > 0) {
          setMatchesData(matchesData);
          localStorage.setItem('matchesData', JSON.stringify(matchesData));
        }
        
        // Check if user has completed 8 questions
        if (userData.isAnalysisComplete && userData.personalityAnalysis) {
          setCompleteUserData(userData);
          setShowDashboard(true);
        } 
      } else {
        // User not found - show no account modal
        setShowSignInModal(false);
        setShowNoAccountModal(true);
      }
      
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      setSignInErrors({ 
        email: error.message || 'Sign in failed. Please try again.' 
      });
      setShowServerError(true);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUpLinkClick = () => {
    setShowSignInModal(false);
    setShowForm(true);
  };

  const handleSignInModalClose = () => {
    setShowSignInModal(false);
    setSignInEmail('');
    setSignInErrors({});
  };

  const handleNoAccountModalClose = () => {
    setShowNoAccountModal(false);
    setSignInEmail('');
  };

  const handleCreateAccountClick = () => {
    setShowNoAccountModal(false);
    setShowForm(true);
  };

  const handleFormComplete = (formData, response) => {
    // Extract user data from response
    if (response && response.data && response.data.user) {
      const userData = response.data.user;
      setUserProfile(userData);
      
      // Store user data in localStorage for persistence
      localStorage.setItem('userProfile', JSON.stringify(userData));
      localStorage.setItem('authToken', 'authenticated');
      
      // NEW: Extract matches data (should be empty for new users)
      const matchesData = response.data.matches;
      if (matchesData) {
        setMatchesData(matchesData);
        localStorage.setItem('matchesData', JSON.stringify(matchesData));
      }
    } 
    
    // Close the form
    setShowForm(false);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleChatClose = () => {
    setShowChat(false);
  };

  const handleDashboardOpen = (userData) => {
    setCompleteUserData(userData);
    setShowChat(false);
    setShowDashboard(true);
    
    // Store updated user data in localStorage for persistence
    localStorage.setItem('userProfile', JSON.stringify(userData));
  };

  const handleNavigateHome = () => {
    setShowDashboard(false);
    // Clear matches data when navigating away from dashboard
    setMatchesData(null);
  };

  const handleProfileClick = () => {
    if (userProfile) {
      // If user has complete data, use it, otherwise use basic profile
      const dataToUse = completeUserData || userProfile;
      setCompleteUserData(dataToUse);
      setShowDashboard(true);
    }
  };

  const handleUserDataUpdate = (updatedUserData) => {
    setUserProfile(updatedUserData); 
    setCompleteUserData(updatedUserData);
    
    // Store updated user data in localStorage for persistence
    localStorage.setItem('userProfile', JSON.stringify(updatedUserData));
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  };

  // Show Dashboard if active
  if (showDashboard && completeUserData) {
    return (
      <Dashboard 
        userProfile={completeUserData}
        matches={matchesData} // NEW: Pass matches data to Dashboard
        onNavigateHome={handleNavigateHome}
        onUserDataUpdate={handleUserDataUpdate}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <>
      <div className="landing-page">
        {/* Animated Background Particles */}
        <div className="particles-container">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <header className="header">
          <div className="logo-section">
            <div className="logo-icon">💜</div>
            <span className="logo-text">Match.AI</span>
          </div>
          
          <div className="nav-section">
            <button className="nav-button">How It Works</button>
            
            <button 
              onClick={handleShareWhatsApp}
              className="share-button"
            >
              <svg className="share-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488"/>
              </svg>
            </button>
            
            {userProfile ? (
 <>
   <div 
     className="user-profile" 
     onClick={userProfile.isAnalysisComplete ? handleProfileClick : undefined}
     style={{ 
       cursor: userProfile.isAnalysisComplete ? 'pointer' : 'not-allowed',
       opacity: userProfile.isAnalysisComplete ? 1 : 0.6
     }}
     title={userProfile.isAnalysisComplete ? 'Go to Dashboard' : 'Complete personality analysis first'}
   >
     <div className="profile-avatar">
       {userProfile.profilePicture ? (
         <img 
           src={userProfile.profilePicture} 
           alt="Profile" 
           className="profile-avatar-image" 
         />
       ) : (
         <div className="profile-avatar-initials">
           {getInitials(userProfile.firstName, userProfile.lastName)}
         </div>
       )}
     </div>
     <div className="profile-name">
       {userProfile.firstName} {userProfile.lastName}
     </div>
   </div>
   <button className="logout-button" onClick={handleLogout} title="Logout">
     <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
       <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
     </svg>
   </button>
 </>
) : (
 <button className="signin-button" onClick={handleSignInClick}>
   Sign In
 </button>
)}
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title-primary">Stop Swiping.</h1>
          <h2 className="hero-title-secondary">
            Start <span className="highlight">Matching.</span>
          </h2>
          <p className="hero-description">
            Experience the future of dating with AI-powered matching. No more endless swiping, no more missed connections. 
            Let our intelligent algorithm find your perfect match based on deep compatibility, not just photos.
          </p>
          
          <button className="try-now-button" onClick={handleTryNow}>
            {userProfile ? 'Chat with AI to Get Your Perfect Match' : 'Try Now for Free'}
          </button>
        </section>

        {/* Benefits Cards */}
        <section className="benefits-section">
          <div className="cards-container">
            <div className="benefit-card">
              <div className="card-icon">🧠</div>
              <h3 className="card-title">Smart Matching</h3>
              <p className="card-description">
                Our advanced AI analyzes personality, interests, and values to find truly compatible matches, 
                not just surface-level attractions.
              </p>
            </div>

            <div className="benefit-card">
              <div className="card-icon">⏰</div>
              <h3 className="card-title">Save Time</h3>
              <p className="card-description">
                Skip the endless scrolling and mindless swiping. Get quality matches delivered to you 
                when it matters most.
              </p>
            </div>

            <div className="benefit-card">
              <div className="card-icon">💝</div>
              <h3 className="card-title">Real Connections</h3>
              <p className="card-description">
                Build meaningful relationships with people who share your values, goals, and lifestyle. 
                Quality over quantity, always.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p className="footer-text">
            © 2025 Studio Innovate Private Limited. All rights reserved.
          </p>
        </footer>
      </div>

      {/* AI Chat Interface */}
      {showChat && (
        <AIChatInterface 
          onClose={handleChatClose}
          userProfile={userProfile}
          onDashboardOpen={handleDashboardOpen}
          onLogout={handleLogout}
        />
      )}

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="signin-modal-overlay">
          <div className="signin-modal-content">
            <div className="signin-modal-header">
              <h2 className="signin-modal-title">Welcome Back! 👋</h2>
              <button className="signin-modal-close" onClick={handleSignInModalClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="signin-modal-body">
              <p className="signin-modal-subtitle">
                Sign in to find your perfect matches with AI
              </p>

              <div className="signin-form-group">
                <label className="signin-form-label">Email address</label>
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={`signin-form-input ${signInErrors.email ? 'error' : ''}`}
                  disabled={isSigningIn}
                />
                {signInErrors.email && (
                  <span className="signin-error-text">{signInErrors.email}</span>
                )}
              </div>

              <button 
                className={`signin-submit-button ${isSigningIn ? 'loading' : ''}`}
                onClick={handleSignInSubmit}
                disabled={isSigningIn}
              >
                {isSigningIn ? (
                  <>
                    <span>Signing In...</span>
                    <div className="loading-spinner"></div>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="signin-divider">
                <span className="signin-divider-text">OR</span>
              </div>

              <div className="google-signin-container">
                {isGoogleLoaded ? (
                  <div ref={googleSignInButtonRef} className="google-button-wrapper"></div>
                ) : (
                  <div className="google-loading">
                    <div className="loading-spinner"></div>
                    Loading Google Sign-In...
                  </div>
                )}
              </div>

              <div className="signin-signup-link">
                <p>
                  No account yet?{' '}
                  <button 
                    className="signup-link-button"
                    onClick={handleSignUpLinkClick}
                  >
                    Sign up for free
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Account Found Modal */}
      {showNoAccountModal && (
        <div className="no-account-modal-overlay">
          <div className="no-account-modal-content">
            <div className="no-account-modal-header">
              <div className="no-account-icon">🔍</div>
              <h2 className="no-account-modal-title">Account Not Found</h2>
              <button className="no-account-modal-close" onClick={handleNoAccountModalClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="no-account-modal-body">
              <p className="no-account-modal-message">
                We couldn't find an account with the email address:
              </p>
              <p className="no-account-email">{signInEmail}</p>
              <p className="no-account-modal-subtitle">
                Would you like to create a new account? It only takes a few minutes to get started!
              </p>

              <button 
                className="create-account-button"
                onClick={handleCreateAccountClick}
              >
                Create New Account
              </button>

              <div className="no-account-modal-footer">
                <button 
                  className="try-different-email-button"
                  onClick={handleNoAccountModalClose}
                >
                  Try Different Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BasicInfoForm Modal */}
      {showForm && (
        <BasicInfoForm 
          onComplete={handleFormComplete}
          onClose={handleFormClose}
          onBack={handleFormClose}
        />
      )}

      <ErrorModal 
        isOpen={showServerError} 
        onOkClick={handleErrorOkClick}
      />
    </>
  );
};

export default LandingPage;
