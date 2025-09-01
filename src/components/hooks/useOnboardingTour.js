import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import ErrorModal from '../ErrorModal';

const useOnboardingTour = (userProfile, onUserDataUpdate, isMobile, openMobileMenu, closeMobileMenu) => {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [targetElement, setTargetElement] = useState(null);
  const [targetPosition, setTargetPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [tourCompleted, setTourCompleted] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const tourRef = useRef(null);
  const menuOpenedByTour = useRef(false);

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Just close the error modal, user stays on the current page
  };

  // Check if user needs onboarding tour
  useEffect(() => {
    // Don't show tour if already completed in this session or if user has seen it before
    if (userProfile?.isAnalysisComplete && 
        !userProfile?.hasSeenDashboardTour && 
        !showTour && 
        !tourCompleted) {
      setTimeout(() => {
        setShowTour(true);
      }, 1000);
    }
  }, [userProfile?.isAnalysisComplete, userProfile?.hasSeenDashboardTour, showTour, tourCompleted]);

  // Tour steps configuration - moved outside component or memoized to fix dependency
  const tourSteps = useRef([
    {
      target: null, // Welcome step - no target
      title: 'Welcome to Match.AI!',
      content: 'Congratulations on completing your personality analysis! Let\'s take a quick tour to help you get the most out of your Match.AI experience.',
      placement: 'center',
      icon: '🎉',
      requiresMenu: false
    },
    {
      target: '[data-tour="enrich-profile"]',
      title: 'Enrich Your Profile',
      content: 'Take your profile to the next level! Chat with our AI assistant and answer 7 more personality questions to unlock deeper insights and get even better matches.',
      placement: 'right',
      icon: '✨',
      requiresMenu: true
    },
    {
      target: '[data-tour="profile"]',
      title: 'Your Profile',
      content: 'Upload multiple photos and customize your profile settings. A complete profile with great photos significantly increases your chances of meaningful connections!',
      placement: 'right',
      icon: '👤',
      requiresMenu: true
    },
    {
      target: '[data-tour="build-bio"]',
      title: 'Build Your Bio',
      content: 'Craft a compelling bio that showcases your personality and interests. A great bio helps potential matches get to know the real you beyond just photos!',
      placement: 'right',
      icon: '✍️',
      requiresMenu: true
    },
    {
      target: '[data-tour="match-settings"]',
      title: 'Match Settings',
      content: 'Choose from 4 powerful matching algorithms! Whether you prefer similarity-based, complementary, multi-dimensional, or deal-breaker filtering - find what works for you.',
      placement: 'right',
      icon: '⚙️',
      requiresMenu: true
    },
    {
      target: '[data-tour="questions"]',
      title: 'Personality Questions',
      content: 'Want to refine your results? Come back anytime to chat with Match.AI and update your answers. Remember, your personality analysis is the foundation of great matches!',
      placement: 'right',
      icon: '❓',
      requiresMenu: true
    },
    {
      target: '[data-tour="personality-analysis"]',
      title: 'Personality Analysis',
      content: 'Discover your comprehensive personality profile! Explore your traits, strengths, and relationship style based on advanced AI analysis of your responses.',
      placement: 'right',
      icon: '🧠',
      requiresMenu: true
    },
    {
      target: '[data-tour="matches"]',
      title: 'Your Matches',
      content: 'The moment you\'ve been waiting for! Your daily AI-generated matches appear here. Check back regularly for new connections tailored specifically to your personality!',
      placement: 'top',
      icon: '💕',
      requiresMenu: true
    }
  ]).current;

  // Calculate target element position
  const calculateTargetPosition = useCallback((element) => {
    if (!element) return { top: 0, left: 0, width: 0, height: 0 };
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
      absoluteTop: rect.top,
      absoluteBottom: rect.bottom
    };
  }, []);

  // Handle mobile menu opening/closing for tour steps
  useEffect(() => {
    if (!showTour || !isMobile) return;

    const step = tourSteps[currentStep];
    
    if (step.requiresMenu && openMobileMenu) {
      // Open menu for steps that need it
      openMobileMenu();
      menuOpenedByTour.current = true;
    } else if (!step.requiresMenu && menuOpenedByTour.current && closeMobileMenu) {
      // Close menu for steps that don't need it
      closeMobileMenu();
      menuOpenedByTour.current = false;
    }
  }, [currentStep, showTour, isMobile, openMobileMenu, closeMobileMenu, tourSteps]);

  // Update target element and position when step changes
  useEffect(() => {
    if (!showTour) return;

    const step = tourSteps[currentStep];
    
    if (!step?.target) {
      setTargetElement(null);
      setTargetPosition({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }

    // Add a small delay to ensure DOM is ready (especially for mobile menu)
    const timeoutId = setTimeout(() => {
      // For mobile, look for mobile menu items; for desktop, look for sidebar items
      let selector = step.target;
      if (isMobile && step.requiresMenu) {
        // Check if we're looking for a mobile menu item
        const mobileElement = document.querySelector(`.mobile-menu-item${step.target}`);
        if (mobileElement) {
          selector = `.mobile-menu-item${step.target}`;
        }
      }
      
      const element = document.querySelector(selector);
      
      if (element) {
        setTargetElement(element);
        const position = calculateTargetPosition(element);
        setTargetPosition(position);
        
        if (isMobile && step.requiresMenu) {
          // For mobile menu items, ensure they're visible
          const menuNav = document.querySelector('.mobile-menu-nav');
          if (menuNav && element) {
            // Scroll the menu item into view within the menu container
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }
        } else if (!isMobile) {
          // Desktop scrolling logic
          const rect = element.getBoundingClientRect();
          const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
          
          if (!isVisible) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }
        }
      } else {
        console.error(`Step ${currentStep + 1}: Element not found for ${step.target}`);
      }
    }, isMobile && step.requiresMenu ? 300 : 100); // Longer delay for mobile menu items

    return () => clearTimeout(timeoutId);
  }, [currentStep, showTour, calculateTargetPosition, isMobile, tourSteps]);

  // Handle window resize
  useEffect(() => {
    if (!targetElement) return;

    const handleResize = () => {
      setTargetPosition(calculateTargetPosition(targetElement));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetElement, calculateTargetPosition]);

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    completeTour();
  };

  // Complete tour and update user profile
  const completeTour = async () => {
    if (!userProfile?.email || isUpdatingUser) {
      return;
    }

    // Close mobile menu if it was opened by tour
    if (isMobile && menuOpenedByTour.current && closeMobileMenu) {
      closeMobileMenu();
      menuOpenedByTour.current = false;
    }

    // Set local completion flag immediately
    setTourCompleted(true);
    
    // Hide tour immediately to prevent restart
    setShowTour(false);
    setCurrentStep(0);
    setIsUpdatingUser(true);
    
    try {
      const requestBody = {
        email: userProfile.email,
        hasSeenDashboardTour: true,
        tourCompletedAt: new Date().toISOString()
      };
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/tour-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local state
      const updatedUserData = result.data.user;
      
      if (onUserDataUpdate) {
        onUserDataUpdate(updatedUserData);
      }

    } catch (error) {
      console.error('❌ Error updating tour status:', error);
      setShowServerError(true);
      // Keep tour hidden even if API fails
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Tour component
  const TourComponent = () => {
    if (!showTour) return null;

    const currentStepData = tourSteps[currentStep];
    const isWelcomeStep = currentStep === 0;
    const isLastStep = currentStep === tourSteps.length - 1;

    // Position calculation for the tour content
    const getTourContentStyle = () => {
      // Welcome step - always centered
      if (isWelcomeStep) {
        if (isMobile) {
          return {
            position: 'fixed',
            top: '50%',
            left: '20px',
            right: '20px',
            transform: 'translateY(-50%)',
            maxWidth: '400px',
            margin: '0 auto'
          };
        }
        // Desktop welcome
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
      }
      
      // Mobile positioning - always at bottom
      if (isMobile) {
        return {
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          maxWidth: 'none',
          zIndex: 10002
        };
      }
      
      // Desktop positioning logic (unchanged)
      const viewportHeight = window.innerHeight;
      const tooltipHeight = 320;
      const tooltipWidth = 400;
      const padding = 20;
      
      let top, left;
      
      // Check if element is in sidebar (left side of screen)
      const isLeftSideElement = targetPosition.left < 300;
      
      // For sidebar elements, always position to the right
      if (isLeftSideElement && currentStepData.placement === 'right') {
        const elementCenter = targetPosition.top + (targetPosition.height / 2);
        const idealTop = elementCenter - (tooltipHeight / 2);
        
        if (idealTop < padding) {
          top = padding;
        } else if (idealTop + tooltipHeight > window.pageYOffset + viewportHeight - padding) {
          top = window.pageYOffset + viewportHeight - tooltipHeight - padding;
        } else {
          top = idealTop;
        }
        
        left = targetPosition.left + targetPosition.width + 20;
        
        if (left + tooltipWidth > window.innerWidth - padding) {
          left = window.innerWidth - tooltipWidth - padding;
        }
      } 
      // For last step or elements at bottom, position above
      else if (isLastStep || targetPosition.absoluteBottom > viewportHeight - tooltipHeight - 100) {
        top = Math.max(padding, targetPosition.top - tooltipHeight - 20);
        left = Math.max(padding, Math.min(targetPosition.left, window.innerWidth - tooltipWidth - padding));
      }
      // Default: position below element
      else {
        top = targetPosition.top + targetPosition.height + 20;
        left = Math.max(padding, Math.min(targetPosition.left, window.innerWidth - tooltipWidth - padding));
      }
      
      return {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        maxWidth: `${tooltipWidth}px`
      };
    };

    return createPortal(
      <>
        <div className="tour-overlay">
          {/* Backdrop */}
          <div className="tour-backdrop" />
          
          {/* Spotlight for target element - Desktop only */}
          {targetElement && !isMobile && (
            <div 
              className="tour-spotlight"
              style={{
                top: targetPosition.top - 8,
                left: targetPosition.left - 8,
                width: targetPosition.width + 16,
                height: targetPosition.height + 16,
              }}
            />
          )}
          
          {/* Mobile highlight - transparent to avoid obscuring content */}
          {targetElement && isMobile && (
            <div 
              className="tour-highlight-mobile"
              style={{
                position: 'fixed',
                top: targetElement.getBoundingClientRect().top - 2,
                left: targetElement.getBoundingClientRect().left - 2,
                width: targetElement.getBoundingClientRect().width + 4,
                height: targetElement.getBoundingClientRect().height + 4,
                border: '2px solid #8b5cf6',
                borderRadius: '8px',
                background: 'transparent', // Transparent to avoid obscuring
                pointerEvents: 'none',
                zIndex: 10001,
                animation: 'mobilePulse 2s ease-in-out infinite'
              }}
            />
          )}

          {/* Tour content */}
          <div 
            ref={tourRef}
            className={`tour-content ${isWelcomeStep ? 'tour-content-center' : 'tour-content-positioned'}`}
            style={getTourContentStyle()}
          >
            <div className="tour-card">
              {/* Header */}
              <div className="tour-header">
                <div className="tour-icon">{currentStepData.icon}</div>
                <h3 className="tour-title">{currentStepData.title}</h3>
              </div>

              {/* Content */}
              <div className="tour-body">
                <p className="tour-text">{currentStepData.content}</p>
                {isWelcomeStep && (
                  <p className="tour-subtitle">This will only take 2 minutes ✨</p>
                )}
              </div>

              {/* Footer */}
              <div className="tour-footer">
                <div className="tour-progress">
                  <span className="tour-step-count">
                    Step {currentStep + 1} of {tourSteps.length}
                  </span>
                  <div className="tour-progress-bar">
                    <div 
                      className="tour-progress-fill"
                      style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className={`tour-buttons ${isMobile ? 'tour-buttons-mobile' : ''}`}>
                  {currentStep > 0 && (
                    <button className="tour-btn tour-btn-secondary" onClick={goToPrevStep}>
                      Previous
                    </button>
                  )}
                  
                  {!isMobile && (
                    <button className="tour-btn tour-btn-skip" onClick={skipTour}>
                      Skip Tour
                    </button>
                  )}
                  
                  <button className="tour-btn tour-btn-primary" onClick={goToNextStep}>
                    {isLastStep ? 'Finish Tour' : 'Next'}
                  </button>
                  
                  {isMobile && (
                    <button className="tour-btn tour-btn-skip-mobile" onClick={skipTour}>
                      Skip Tour
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tour Styles */}
          <style jsx>{`
            .tour-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 10000;
              pointer-events: auto;
            }

            .tour-backdrop {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.7);
              animation: fadeIn 0.3s ease;
            }

            .tour-spotlight {
              position: absolute;
              background: rgba(255, 255, 255, 0.1);
              border: 2px solid #8b5cf6;
              border-radius: 8px;
              box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
              animation: spotlightGlow 2s ease-in-out infinite alternate;
              pointer-events: none;
              z-index: 10001;
            }

            .tour-content {
              z-index: 10002;
              animation: slideIn 0.4s ease-out;
            }

            .tour-content-center {
              /* Positioning handled by inline styles */
            }

            .tour-content-positioned {
              /* Positioning handled by inline styles */
            }

            .tour-card {
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
              overflow: hidden;
              border: 1px solid #e2e8f0;
            }

            .tour-header {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 20px 20px 0 20px;
              position: relative;
            }

            .tour-icon {
              font-size: 24px;
              flex-shrink: 0;
            }

            .tour-title {
              color: #2d3748;
              font-size: 18px;
              font-weight: 700;
              margin: 0;
              flex: 1;
            }

            .tour-body {
              padding: 16px 20px;
            }

            .tour-text {
              color: #4b5563;
              font-size: 14px;
              line-height: 1.6;
              margin: 0;
            }

            .tour-subtitle {
              color: #8b5cf6;
              font-weight: 600;
              font-size: 13px;
              margin: 12px 0 0 0;
              text-align: center;
            }

            .tour-footer {
              padding: 0 20px 20px 20px;
            }

            .tour-progress {
              margin-bottom: 16px;
            }

            .tour-step-count {
              color: #6b7280;
              font-size: 12px;
              font-weight: 500;
              display: block;
              margin-bottom: 8px;
            }

            .tour-progress-bar {
              width: 100%;
              height: 4px;
              background: #e5e7eb;
              border-radius: 2px;
              overflow: hidden;
            }

            .tour-progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #8b5cf6, #a855f7);
              border-radius: 2px;
              transition: width 0.3s ease;
            }

            .tour-buttons {
              display: flex;
              gap: 8px;
              align-items: center;
            }

            .tour-buttons-mobile {
              flex-wrap: wrap;
            }

            .tour-btn {
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              border: none;
            }

            .tour-btn-primary {
              background: linear-gradient(135deg, #8b5cf6, #a855f7);
              color: white;
              flex: 1;
            }

            .tour-btn-primary:hover {
              background: linear-gradient(135deg, #7c3aed, #9333ea);
              transform: translateY(-1px);
            }

            .tour-btn-secondary {
              background: #f3f4f6;
              color: #374151;
              border: 1px solid #d1d5db;
            }

            .tour-btn-secondary:hover {
              background: #e5e7eb;
            }

            .tour-btn-skip {
              background: none;
              color: #9ca3af;
              font-size: 12px;
              padding: 4px 8px;
            }

            .tour-btn-skip:hover {
              color: #6b7280;
            }

            .tour-btn-skip-mobile {
              background: none;
              color: #9ca3af;
              font-size: 12px;
              padding: 6px 12px;
              width: 100%;
              margin-top: 8px;
            }

            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }

            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes spotlightGlow {
              from {
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px #8b5cf6;
              }
              to {
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px #a855f7;
              }
            }

            @keyframes mobilePulse {
              0%, 100% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.8;
                transform: scale(1.02);
              }
            }

            @media (max-width: 768px) {
              .tour-header {
                padding: 16px 16px 0 16px;
              }

              .tour-body {
                padding: 12px 16px;
              }

              .tour-footer {
                padding: 0 16px 16px 16px;
              }

              .tour-title {
                font-size: 16px;
              }

              .tour-text {
                font-size: 13px;
              }

              .tour-icon {
                font-size: 20px;
              }

              .tour-buttons {
                justify-content: space-between;
              }

              .tour-btn-primary {
                flex: 1;
                max-width: none;
              }

              .tour-btn-secondary {
                flex: 0 0 auto;
                min-width: 80px;
              }
            }

            @media (max-width: 480px) {
              .tour-card {
                border-radius: 12px;
              }

              .tour-buttons {
                gap: 6px;
              }

              .tour-btn {
                padding: 8px 12px;
                font-size: 13px;
              }
            }
          `}</style>
        </div>
        
        <ErrorModal 
          isOpen={showServerError} 
          onOkClick={handleErrorOkClick}
        />
      </>,
      document.body
    );
  };

  return {
    showTour,
    TourComponent,
    skipTour,
    isUpdatingUser,
    currentStep: currentStep + 1,
    totalSteps: tourSteps.length
  };
};

export default useOnboardingTour;