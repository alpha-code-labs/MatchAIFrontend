import React, { useState, useEffect, useCallback } from 'react';
import { database } from '../config/firebase';
import { ref, onValue, off } from 'firebase/database';
import EnrichProfile from './dashboard/EnrichProfile';
import Profile from './dashboard/Profile';
import MatchSettings from './dashboard/MatchSettings';
import Questions from './dashboard/Questions';
import PersonalityAnalysis from './dashboard/PersonalityAnalysis';
import Matches from './dashboard/Matches';
import Messages from './dashboard/Messages';
import HowItWorks from './dashboard/HowItWorks';
import BuildBio from './dashboard/BuildBio';
import useOnboardingTour from './hooks/useOnboardingTour';
import ErrorModal from './ErrorModal';
import './Dashboard.css';

const Dashboard = ({ userProfile, matches, onNavigateHome, onUserDataUpdate, onLogout }) => {
  const [activeSection, setActiveSection] = useState('enrich');
  const [particles, setParticles] = useState([]);
  const [currentUserProfile, setCurrentUserProfile] = useState(userProfile);
  // const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchesData, setMatchesData] = useState(null);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [showServerError, setShowServerError] = useState(false);
  
  // NEW: Mobile hamburger menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tourControlsMenu, setTourControlsMenu] = useState(false); // NEW: Tour control flag
  const [showProfileDropdown, setShowProfileDropdown] = useState(false); // NEW: Profile dropdown state

  // PWA-related state
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ isMobile: false, isTablet: false });

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Just close the error modal, user stays on the current page
  };

  // NEW: Menu control functions for tour
  const openMobileMenuForTour = () => {
    if (isMobile) {
      setShowMobileMenu(true);
      setTourControlsMenu(true);
    }
  };

  const closeMobileMenuFromTour = () => {
    if (isMobile && tourControlsMenu) {
      setShowMobileMenu(false);
      setTourControlsMenu(false);
    }
  };

  const { TourComponent } = useOnboardingTour(
    currentUserProfile, 
    onUserDataUpdate,
    isMobile,
    openMobileMenuForTour,
    closeMobileMenuFromTour
  );

  // All existing handler functions with useCallback...
  const updatePWAStatus = useCallback(async (updateData) => {
    if (!currentUserProfile?.email) {
      console.error('No user email available for PWA status update');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/pwa-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUserProfile.email,
          ...updateData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const updatedUserData = result.data.user;
      setCurrentUserProfile(updatedUserData);

      if (onUserDataUpdate) {
        onUserDataUpdate(updatedUserData);
      }
    } catch (error) {
      console.error('❌ Error updating PWA status:', error);
      setShowServerError(true);
    }
  }, [currentUserProfile?.email, onUserDataUpdate]);

  // NEW: Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      // Close mobile menu when switching to desktop
      if (width > 768) {
        setShowMobileMenu(false);
        setTourControlsMenu(false);
        setShowProfileDropdown(false); // Close profile dropdown on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // NEW: Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showProfileDropdown && !e.target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // NEW: Close mobile menu when navigation changes
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    if (isMobile && !tourControlsMenu) { // Don't close if tour is controlling
      setShowMobileMenu(false);
    }
  };

  // NEW: Close mobile menu on overlay click
  const handleMobileMenuOverlayClick = (e) => {
    if (e.target === e.currentTarget && !tourControlsMenu) { // Don't close if tour is controlling
      setShowMobileMenu(false);
    }
  };

  // NEW: Handle profile avatar click on mobile
  const handleProfileClick = (e) => {
    e.stopPropagation();
    setShowProfileDropdown(!showProfileDropdown);
  };

  // NEW: Handle logout from profile dropdown
  const handleProfileLogout = () => {
    setShowProfileDropdown(false);
    handleLogout();
  };

  // NEW: Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu, isMobile]);

  // All existing useEffect hooks remain exactly the same...
  // Service worker message listener
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'NAVIGATE') {
        const { url } = event.data;
        if (url.includes('matches') || url.includes('#/matches')) {
          setActiveSection('matches');
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Device detection
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobile = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent);
      const screenWidth = window.innerWidth;
      const isMobileScreen = screenWidth <= 768;

      const deviceInfo = {
        isMobile: isMobile || (isTablet && isMobileScreen),
        isTablet,
        userAgent,
        screenWidth
      };

      setDeviceInfo(deviceInfo);
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Check for globally captured deferred prompt on component mount
  useEffect(() => {
    if (window.deferredPrompt && !deferredPrompt) {
      console.log('📱 Dashboard: Found globally captured deferred prompt');
      setDeferredPrompt(window.deferredPrompt);
    }
  }, [deferredPrompt]);

  // PWA beforeinstallprompt event listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPWAPrompt(false);
      updatePWAStatus({ isPWAInstalled: true });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [updatePWAStatus]);

  // Trigger PWA prompt after tour completion
  useEffect(() => {
    if (currentUserProfile?.hasSeenDashboardTour &&
        !currentUserProfile?.isPWAInstalled &&
        !currentUserProfile?.pwaInstallPromptShown &&
        deviceInfo.isMobile &&
        deferredPrompt) {
      setTimeout(() => {
        setShowPWAPrompt(true);
        updatePWAStatus({ pwaPromptShown: true });
      }, 1500);
    }
  }, [currentUserProfile?.hasSeenDashboardTour, currentUserProfile?.isPWAInstalled,
      currentUserProfile?.pwaInstallPromptShown, deviceInfo.isMobile, deferredPrompt, updatePWAStatus]);

  // Check for PWA re-prompt eligibility on signin
  useEffect(() => {
    if (!currentUserProfile) return;

    if (currentUserProfile.shouldShowPWAPrompt && deviceInfo.isMobile && deferredPrompt) {
      setShowPWAPrompt(true);
      updatePWAStatus({ pwaPromptShown: true });
    }

    if (currentUserProfile.hasSeenDashboardTour &&
        !currentUserProfile.isPWAInstalled &&
        !currentUserProfile.pwaInstallPromptShown &&
        deviceInfo.isMobile &&
        deferredPrompt) {
      setShowPWAPrompt(true);
      updatePWAStatus({ pwaPromptShown: true });
    }
  }, [currentUserProfile, deviceInfo.isMobile, deferredPrompt, updatePWAStatus]);

  // Handle matches data and show notification popup
  useEffect(() => {
    if (matches && matches.totalCount > 0) {
      setMatchesData(matches);
      // setShowMatchNotification(true);
    }
  }, [matches]);

  // Update currentUserProfile when userProfile prop changes
  useEffect(() => {
    if (userProfile) {
      setCurrentUserProfile(userProfile);
    }
  }, [userProfile]);

  // Set up real-time listener for unread messages
  useEffect(() => {
    if (!currentUserProfile?.id) return;

    const conversationsRef = ref(database, 'conversations');
    
    const handleUnreadUpdate = (snapshot) => {
      if (snapshot.exists()) {
        const conversationsData = snapshot.val();
        let totalUnread = 0;

        // eslint-disable-next-line no-unused-vars
        for (const [chatId, conversation] of Object.entries(conversationsData)) {
          if (conversation.participants && conversation.participants[currentUserProfile.id]) {
            const userUnreadCount = conversation.participants[currentUserProfile.id]?.unreadCount || 0;
            totalUnread += userUnreadCount;
          }
        }

        setTotalUnreadMessages(totalUnread);
      } else {
        setTotalUnreadMessages(0);
      }
    };

    onValue(conversationsRef, handleUnreadUpdate);

    return () => {
      off(conversationsRef, 'value', handleUnreadUpdate);
    };
  }, [currentUserProfile?.id]);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 30; i++) {
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

  const handlePWAInstall = async () => {
    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        const { outcome } = await deferredPrompt.prompt();

        if (outcome === 'accepted') {
          await updatePWAStatus({
            pwaPromptAction: 'accepted'
          });
        } else {
          await updatePWAStatus({
            pwaPromptAction: 'dismissed'
          });
        }

        setDeferredPrompt(null);
        setShowPWAPrompt(false);
        setIsInstalling(false);
      } else {
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          alert('To install this app on your iOS device:\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm');
        } else {
          alert('To install this app:\n1. Look for the menu icon (3 dots) in your browser\n2. Find "Add to Home Screen" or "Install App"\n3. Follow the prompts to install');
        }
        setShowPWAPrompt(false);
        setIsInstalling(false);
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
      setIsInstalling(false);
    }
  };

  const handlePWADismiss = () => {
    setShowPWAPrompt(false);
    updatePWAStatus({
      pwaPromptAction: 'rejected'
    });
  };

  const handleHeaderInstallClick = async () => {
    if (deferredPrompt) {
      await handlePWAInstall();
    } else {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        alert('To install Match.AI on your iOS device:\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm');
      } else {
        alert('To install Match.AI:\n1. Look for the menu icon (3 dots) in your browser\n2. Find "Add to Home Screen" or "Install App"\n3. Follow the prompts to install');
      }
    }
  };

  // Removed unused functions: handleViewMatches and handleDismissNotification

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const message = encodeURIComponent(`Check out Match.AI - the future of dating! ${url}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleLogoClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleEnrichmentComplete = (updatedUserData) => {
    setCurrentUserProfile(updatedUserData);
    if (onUserDataUpdate) {
      onUserDataUpdate(updatedUserData);
    } else {
      console.error('Dashboard: onUserDataUpdate callback not available for enrichment');
    }
  };

  const handleProfileUpdate = (updatedUserData) => {
    setCurrentUserProfile(updatedUserData);
    if (onUserDataUpdate) {
      onUserDataUpdate(updatedUserData);
    } else {
      console.error('Dashboard: onUserDataUpdate callback is not available!');
    }
  };

  const handleMatchSettingsUpdate = (updatedUserData) => {
    setCurrentUserProfile(updatedUserData);
    if (onUserDataUpdate) {
      onUserDataUpdate(updatedUserData);
    } else {
      console.error('Dashboard: onUserDataUpdate callback not available for match settings');
    }
  };

  const handleQuestionsUpdate = (updatedUserData) => {
    setCurrentUserProfile(updatedUserData);
    if (onUserDataUpdate) {
      onUserDataUpdate(updatedUserData);
    } else {
      console.error('Dashboard: onUserDataUpdate callback not available for questions');
    }
  };

  const updateUserProfile = (newProfileData) => {
    setCurrentUserProfile(newProfileData);
    if (onUserDataUpdate) {
      onUserDataUpdate(newProfileData);
    } else {
      console.error('Dashboard: onUserDataUpdate callback not available for bio');
    }
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  };

  const sidebarItems = [
    { id: 'enrich', label: 'Enrich Your Profile', icon: '✨', tourId: 'enrich-profile' },
    { id: 'profile', label: 'Profile', icon: '👤', tourId: 'profile' },
    { id: 'build-bio', label: 'Build Your Bio', icon: '✍️', tourId: 'build-bio' },
    { id: 'settings', label: 'Match Settings', icon: '⚙️', tourId: 'match-settings' },
    { id: 'questions', label: 'Questions', icon: '❓', tourId: 'questions' },
    { id: 'analysis', label: 'Personality Analysis', icon: '🧠', tourId: 'personality-analysis' },
    { id: 'how-it-works', label: 'How It Works', icon: '📚', tourId: 'how-it-works' },
    { id: 'matches', label: 'Matches', icon: '💕', tourId: 'matches' },
    { id: 'messages', label: 'Messages', icon: '💬', tourId: 'messages', unreadCount: totalUnreadMessages }
  ];

  const renderContent = () => {
    switch(activeSection) {
      case 'enrich':
        return (
          <EnrichProfile
            userProfile={currentUserProfile}
            onEnrichmentComplete={handleEnrichmentComplete}
          />
        );
      case 'profile':
        return (
          <Profile
            userProfile={currentUserProfile}
            onProfileUpdate={handleProfileUpdate}
          />
        );
      case 'settings':
        return (
          <MatchSettings
            userProfile={currentUserProfile}
            onMatchSettingsUpdate={handleMatchSettingsUpdate}
          />
        );
      case 'questions':
        return (
          <Questions
            userProfile={currentUserProfile}
            onQuestionsUpdate={handleQuestionsUpdate}
          />
        );
      case 'analysis':
        return (
          <PersonalityAnalysis
            userProfile={currentUserProfile}
          />
        );
      case 'build-bio':
        return (
          <BuildBio
            userProfile={currentUserProfile}
            updateUserProfile={updateUserProfile}
          />
        );
      case 'how-it-works':
        return (
          <HowItWorks
            userProfile={currentUserProfile}
          />
        );
      case 'matches':
        return (
          <Matches
            userProfile={currentUserProfile}
            matches={matchesData}
          />
        );
      case 'messages':
        return (
          <Messages
            userProfile={currentUserProfile}
          />
        );
      default:
        return (
          <div className="content-placeholder">
            <div className="placeholder-icon">👤</div>
            <h2>Profile</h2>
            <p>Content coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-page">
      
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

      {/* PWA Install Prompt - Redesigned */}
      {showPWAPrompt && (
        <div className="pwa-prompt-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="pwa-prompt-popup" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '24px',
            padding: '2px',
            maxWidth: '400px',
            width: '90%',
            animation: 'slideUp 0.4s ease',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '22px',
              padding: '30px',
              position: 'relative'
            }}>
              {/* Animated phone illustration */}
              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                position: 'relative'
              }}>
                <div style={{
                  fontSize: '60px',
                  animation: 'bounce 2s infinite',
                  display: 'inline-block'
                }}>
                  📱
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '45%',
                  background: '#ff4458',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  animation: 'pulse 2s infinite'
                }}>
                  3
                </div>
              </div>

              {/* Title */}
              <h2 style={{
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '12px'
              }}>
                Never Miss Your Perfect Match!
              </h2>

              {/* Subtitle */}
              <p style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '15px',
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                Get instant notifications when someone special wants to connect with you
              </p>

              {/* Benefits grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>💕</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436' }}>Instant Matches</span>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #a8e6cf 0%, #81c784 100%)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>💬</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436' }}>Message Alerts</span>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #ffd3e1 0%, #ffafcc 100%)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>⚡</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436' }}>Quick Access</span>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #c7ecee 0%, #95afc0 100%)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>🚀</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3436' }}>Works Offline</span>
                </div>
              </div>

              {/* Action buttons */}
              <button
                onClick={handlePWAInstall}
                disabled={isInstalling}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: isInstalling ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: isInstalling ? 'wait' : 'pointer',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s',
                  transform: isInstalling ? 'scale(0.98)' : 'scale(1)'
                }}
                onMouseEnter={(e) => !isInstalling && (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => !isInstalling && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isInstalling ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Installing...
                  </>
                ) : (
                  <>
                    Install Match.AI
                    <span style={{ fontSize: '20px' }}>→</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePWADismiss}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Maybe Later
              </button>

              {/* Trust badge */}
              <div style={{
                textAlign: 'center',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}>
                  <span style={{ color: '#10b981' }}>🔒</span>
                  Secure & Private • No extra downloads
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        {/* NEW: Mobile header with hamburger */}
        {isMobile ? (
          <div className="mobile-header">
            <button 
              className="hamburger-button"
              onClick={() => !tourControlsMenu && setShowMobileMenu(true)}
              aria-label="Open navigation menu"
              disabled={tourControlsMenu}
            >
              <div className="hamburger-line"></div>
              <div className="hamburger-line"></div>
              <div className="hamburger-line"></div>
            </button>
            
            <div className="logo-section mobile-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
              <div className="logo-icon mobile-logo-icon">💜</div>
              <span className="logo-text mobile-logo-text">Match.AI</span>
            </div>

            <div className="mobile-header-actions">
              {deviceInfo.isMobile && !currentUserProfile?.isPWAInstalled && (
                <button
                  onClick={handleHeaderInstallClick}
                  className="header-install-button mobile"
                  title="Install Match.AI App"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 1.5H6C4.89 1.5 4 2.39 4 3.5V20.5C4 21.61 4.89 22.5 6 22.5H18C19.11 22.5 20 21.61 20 20.5V3.5C20 2.39 19.11 1.5 18 1.5ZM18 20.5H6V4.5H18V20.5ZM12 18C12.55 18 13 17.55 13 17C13 16.45 12.55 16 12 16C11.45 16 11 16.45 11 17C11 17.55 11.45 18 12 18ZM16 10H13V5H11V10H8L12 14L16 10Z"/>
                  </svg>
                </button>
              )}
              
              <button
                onClick={handleShareWhatsApp}
                className="mobile-share-button"
                title="Share on WhatsApp"
              >
                <svg className="share-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488"/>
                </svg>
              </button>
              
              <div className="profile-dropdown-container">
                <div 
                  className="profile-avatar mobile"
                  onClick={handleProfileClick}
                >
                  {currentUserProfile?.profilePicture ? (
                    <img
                      src={currentUserProfile.profilePicture}
                      alt="Profile"
                      className="profile-avatar-image"
                    />
                  ) : (
                    <div className="profile-avatar-initials">
                      {getInitials(currentUserProfile?.firstName, currentUserProfile?.lastName)}
                    </div>
                  )}
                </div>
                
                {showProfileDropdown && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-header">
                      <div className="profile-dropdown-name">
                        {currentUserProfile?.firstName} {currentUserProfile?.lastName}
                      </div>
                      <div className="profile-dropdown-email">
                        {currentUserProfile?.email}
                      </div>
                    </div>
                    <div className="profile-dropdown-divider"></div>
                    <button 
                      className="profile-dropdown-logout"
                      onClick={handleProfileLogout}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop header - unchanged */
          <>
            <div className="logo-section" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
              <div className="logo-icon">💜</div>
              <span className="logo-text">Match.AI</span>
            </div>
            <div className="nav-section">
              <button className="nav-button">How It Works</button>
              {deviceInfo.isMobile && !currentUserProfile?.isPWAInstalled && (
                <button
                  onClick={handleHeaderInstallClick}
                  className="header-install-button"
                  title="Install Match.AI App"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 1.5H6C4.89 1.5 4 2.39 4 3.5V20.5C4 21.61 4.89 22.5 6 22.5H18C19.11 22.5 20 21.61 20 20.5V3.5C20 2.39 19.11 1.5 18 1.5ZM18 20.5H6V4.5H18V20.5ZM12 18C12.55 18 13 17.55 13 17C13 16.45 12.55 16 12 16C11.45 16 11 16.45 11 17C11 17.55 11.45 18 12 18ZM16 10H13V5H11V10H8L12 14L16 10Z"/>
                  </svg>
                  <span className="header-install-text">Install App</span>
                </button>
              )}
              <button
                onClick={handleShareWhatsApp}
                className="share-button"
              >
                <svg className="share-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488"/>
                </svg>
              </button>
              <div className="user-profile">
                <div className="profile-avatar">
                  {currentUserProfile?.profilePicture ? (
                    <img
                      src={currentUserProfile.profilePicture}
                      alt="Profile"
                      className="profile-avatar-image"
                    />
                  ) : (
                    <div className="profile-avatar-initials">
                      {getInitials(currentUserProfile?.firstName, currentUserProfile?.lastName)}
                    </div>
                  )}
                </div>
                <div className="profile-name">
                  {currentUserProfile?.firstName} {currentUserProfile?.lastName}
                </div>
              </div>
              <button className="logout-button" onClick={handleLogout} title="Logout">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </header>

      {/* NEW: Mobile Menu Overlay */}
      {showMobileMenu && isMobile && (
        <div className="mobile-menu-overlay" onClick={handleMobileMenuOverlayClick}>
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <div className="mobile-menu-user">
                <div className="mobile-menu-avatar">
                  {currentUserProfile?.profilePicture ? (
                    <img
                      src={currentUserProfile.profilePicture}
                      alt="Profile"
                      className="mobile-menu-avatar-image"
                    />
                  ) : (
                    <div className="mobile-menu-avatar-initials">
                      {getInitials(currentUserProfile?.firstName, currentUserProfile?.lastName)}
                    </div>
                  )}
                </div>
                <div className="mobile-menu-user-info">
                  <div className="mobile-menu-user-name">
                    {currentUserProfile?.firstName} {currentUserProfile?.lastName}
                  </div>
                  <div className="mobile-menu-user-email">
                    {currentUserProfile?.email}
                  </div>
                </div>
              </div>
              <button 
                className="mobile-menu-close"
                onClick={() => !tourControlsMenu && setShowMobileMenu(false)}
                aria-label="Close navigation menu"
                disabled={tourControlsMenu}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <nav className="mobile-menu-nav">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  className={`mobile-menu-item ${activeSection === item.id ? 'active' : ''}`}
                  data-tour={item.tourId}
                  onClick={() => handleSectionChange(item.id)}
                >
                  <span className="mobile-menu-icon">{item.icon}</span>
                  <span className="mobile-menu-label">{item.label}</span>
                  {item.id === 'messages' && item.unreadCount > 0 && (
                    <span className="mobile-menu-badge">{item.unreadCount}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="dashboard-container">
        {/* Desktop Sidebar - hidden on mobile */}
        {!isMobile && (
          <aside className="dashboard-sidebar">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Dashboard</h3>
            </div>
            <nav className="sidebar-nav">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                  data-tour={item.tourId}
                  onClick={() => handleSectionChange(item.id)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                  {item.id === 'messages' && item.unreadCount > 0 && (
                    <span className="unread-messages-badge">{item.unreadCount}</span>
                  )}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="main-content">
            {renderContent()}
          </div>
        </main>
      </div>

      <TourComponent />

      <ErrorModal 
        isOpen={showServerError} 
        onOkClick={handleErrorOkClick}
      />
    </div>
  );
};

export default Dashboard;
