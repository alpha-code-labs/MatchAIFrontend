import React, { useState, useRef, useEffect, useCallback } from 'react';
import './BasicInfoForm.css';
import ErrorModal from './ErrorModal';

// Curated list of major cities worldwide
const majorCities = [
  // India
  { name: 'Mumbai', country: 'India' },
  { name: 'Delhi', country: 'India' },
  { name: 'Bangalore', country: 'India' },
  { name: 'Chennai', country: 'India' },
  { name: 'Kolkata', country: 'India' },
  { name: 'Hyderabad', country: 'India' },
  { name: 'Pune', country: 'India' },
  { name: 'Ahmedabad', country: 'India' },
  { name: 'Jaipur', country: 'India' },
  { name: 'Surat', country: 'India' },
  
  // United States
  { name: 'New York', country: 'United States' },
  { name: 'Los Angeles', country: 'United States' },
  { name: 'Chicago', country: 'United States' },
  { name: 'Houston', country: 'United States' },
  { name: 'Phoenix', country: 'United States' },
  { name: 'Philadelphia', country: 'United States' },
  { name: 'San Antonio', country: 'United States' },
  { name: 'San Diego', country: 'United States' },
  { name: 'Dallas', country: 'United States' },
  { name: 'San Francisco', country: 'United States' },
  { name: 'Seattle', country: 'United States' },
  { name: 'Miami', country: 'United States' },
  { name: 'Boston', country: 'United States' },
  
  // Other major cities...
  { name: 'London', country: 'United Kingdom' },
  { name: 'Toronto', country: 'Canada' },
  { name: 'Sydney', country: 'Australia' },
  { name: 'Tokyo', country: 'Japan' },
  { name: 'Paris', country: 'France' },
  { name: 'Berlin', country: 'Germany' },
  { name: 'Dubai', country: 'UAE' },
  { name: 'Singapore', country: 'Singapore' }
];

const BasicInfoForm = ({ onComplete, onBack, onClose }) => {
  const [step, setStep] = useState(1);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const googleButtonRef = useRef(null);
  const [showServerError, setShowServerError] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    interestedIn: '',
    city: '',
    lookingFor: '',
    relationshipStatus: '',
    email: '',
    phone: '',
    profilePicture: null,
    profilePicturePreview: null,
    profilePictureFromGoogle: null
  });

  const [errors, setErrors] = useState({});

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent zoom on input focus for mobile
  useEffect(() => {
    const preventZoom = (e) => {
      if (isMobile && e.target.tagName === 'INPUT') {
        e.target.style.fontSize = '16px';
      }
    };

    document.addEventListener('focusin', preventZoom);
    return () => document.removeEventListener('focusin', preventZoom);
  }, [isMobile]);

  // Filter cities based on search term
  const filteredCities = majorCities
    .filter(city => 
      city.name.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
      city.country.toLowerCase().includes(citySearchTerm.toLowerCase())
    )
    .slice(0, 10);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Google Sign-In Handler
  const handleGoogleSignIn = useCallback((response) => {
    try {
      
      const decoded = JSON.parse(atob(response.credential.split('.')[1]));
      
      if (decoded.given_name && !formData.firstName) {
        updateField('firstName', decoded.given_name);
      }
      if (decoded.family_name && !formData.lastName) {
        updateField('lastName', decoded.family_name);
      }
      if (decoded.email) {
        updateField('email', decoded.email);
      }
      if (decoded.picture && !formData.profilePicture) {
        setFormData(prev => ({
          ...prev,
          profilePicturePreview: decoded.picture,
          profilePictureFromGoogle: decoded.picture
        }));
      }
            
    } catch (error) {
      console.error('Error processing Google sign-in:', error);
      console.error('❌ There was an error signing in with Google. Please try again.');
    }
  }, [formData.firstName, formData.lastName, formData.profilePicture, updateField]);

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

  // Render Google Button
  useEffect(() => {
    if (isGoogleLoaded && googleButtonRef.current && step === 5) {
      googleButtonRef.current.innerHTML = '';
      
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signup_with',
        width: '100%',
        logo_alignment: 'left',
      });
    }
  }, [isGoogleLoaded, step]);

  const handleCitySelect = (cityName, country) => {
    const cityValue = `${cityName}, ${country}`;
    updateField('city', cityValue);
    setCitySearchTerm(cityValue);
    setShowCityDropdown(false);
  };

  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setCitySearchTerm(value);
    updateField('city', value);
    setShowCityDropdown(value.length > 0);
  };

  const handleCityInputFocus = () => {
    setShowCityDropdown(citySearchTerm.length > 0);
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, WebP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      
      setFormData(prev => ({ 
        ...prev, 
        profilePicture: file,
        profilePicturePreview: previewUrl,
        profilePictureFromGoogle: null
      }));
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    switch(currentStep) {
      case 1:
        if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.age || formData.age < 18 || formData.age > 100) newErrors.age = 'Age must be between 18-100';
        break;
      case 2:
        if (!formData.gender) newErrors.gender = 'Please select your gender';
        if (!formData.interestedIn) newErrors.interestedIn = 'Please select who you\'re interested in';
        break;
      case 3:
        if (!formData.city?.trim()) newErrors.city = 'City is required';
        if (!formData.lookingFor) newErrors.lookingFor = 'Please select what you\'re looking for';
        break;
      case 4:
        if (!formData.relationshipStatus) newErrors.relationshipStatus = 'Please select your relationship status';
        break;
      case 5:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;
      case 6:
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (validateStep(step)) {
      if (step < 6) {
        setStep(step + 1);
      } else {
        await handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('age', formData.age);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('interestedIn', formData.interestedIn);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('lookingFor', formData.lookingFor);
      formDataToSend.append('relationshipStatus', formData.relationshipStatus);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone || '');
      
      // Implement profile picture priority logic
      if (formData.profilePicture && formData.profilePicture instanceof File) {
        formDataToSend.append('profilePicture', formData.profilePicture);
        formDataToSend.append('profilePictureSource', 'uploaded');
      } else if (formData.profilePictureFromGoogle) {
        formDataToSend.append('profilePictureFromGoogle', formData.profilePictureFromGoogle);
        formDataToSend.append('profilePictureSource', 'google');
      } else {
        formDataToSend.append('profilePictureSource', 'none');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/register`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // CRITICAL: Call onComplete IMMEDIATELY with result
      if (onComplete) {
        onComplete(formData, result);
      }
      
      // Show success message
      setShowWelcomeMessage(true);
      
      setTimeout(() => {
        setShowWelcomeMessage(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      // Show the global error modal instead of the old error message
      setShowServerError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Navigate to landing page
    if (onClose) {
      onClose();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleClose = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    setShowExitModal(false);
    if (onClose) {
      onClose();
    } else {
      onBack();
    }
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="form-step">
            <h2 className="step-title">Let's start with the basics! ✨</h2>
            
            <div className="form-group">
              <label>Profile Picture (Optional)</label>
              <div className="profile-upload">
                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profile-picture" className="profile-upload-label">
                  {formData.profilePicturePreview ? (
                    <img src={formData.profilePicturePreview} alt="Profile preview" className="profile-preview" />
                  ) : (
                    <div className="profile-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      <span>Add Photo</span>
                    </div>
                  )}
                </label>
              </div>
              {errors.profilePicture && <span className="error-text">{errors.profilePicture}</span>}
              <small className="helper-text profile-helper">
                💡 While not required, adding a photo significantly increases your chances of making meaningful connections!
              </small>
            </div>

            <div className="form-group">
              <label>What's your name?</label>
              <div className="name-row">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="First name"
                  className={errors.firstName ? 'error' : ''}
                />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Last name"
                  className={errors.lastName ? 'error' : ''}
                />
              </div>
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
            
            <div className="form-group">
              <label>How old are you?</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="25"
                min="18"
                max="100"
                className={errors.age ? 'error' : ''}
              />
              {errors.age && <span className="error-text">{errors.age}</span>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <h2 className="step-title">Tell us about yourself 🌟</h2>
            <div className="form-group">
              <label>I identify as</label>
              <div className="option-grid">
                {['Man', 'Woman', 'Non-binary', 'Other'].map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`option-button ${formData.gender === option ? 'selected' : ''}`}
                    onClick={() => updateField('gender', option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.gender && <span className="error-text">{errors.gender}</span>}
            </div>
            <div className="form-group">
              <label>I'm interested in</label>
              <div className="option-grid">
                {['Men', 'Women', 'Non-binary', 'Everyone'].map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`option-button ${formData.interestedIn === option ? 'selected' : ''}`}
                    onClick={() => updateField('interestedIn', option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.interestedIn && <span className="error-text">{errors.interestedIn}</span>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <h2 className="step-title">Where are you located? 📍</h2>
            <div className="form-group">
              <label>Your city</label>
              <div className="city-input-container">
                <input
                  type="text"
                  value={citySearchTerm}
                  onChange={handleCityInputChange}
                  onFocus={handleCityInputFocus}
                  placeholder="Search for your city..."
                  className={errors.city ? 'error' : ''}
                />
                {showCityDropdown && (
                  <div className={`city-dropdown ${isMobile ? 'mobile' : ''}`}>
                    {isMobile && (
                      <div className="city-dropdown-header">
                        <h3>Select City</h3>
                        <button 
                          className="close-dropdown"
                          onClick={() => setShowCityDropdown(false)}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <div className="city-options-container">
                      {filteredCities.length > 0 ? (
                        filteredCities.map((city, index) => (
                          <div
                            key={index}
                            className="city-option"
                            onClick={() => handleCitySelect(city.name, city.country)}
                          >
                            <span className="city-name">{city.name}</span>
                            <span className="city-country">{city.country}</span>
                          </div>
                        ))
                      ) : (
                        <div className="city-option">
                          <span className="city-name">Use "{citySearchTerm}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.city && <span className="error-text">{errors.city}</span>}
            </div>
            <div className="form-group">
              <label>What are you looking for?</label>
              <div className="option-grid">
                {['Friendship', 'Dating/Relationships', 'Both'].map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`option-button ${formData.lookingFor === option ? 'selected' : ''}`}
                    onClick={() => updateField('lookingFor', option)}
                  >
                    {option === 'Dating/Relationships' ? '💕 Dating' : option === 'Friendship' ? '👥 Friends' : '🌟 Both'}
                    <br />
                    <small>{option}</small>
                  </button>
                ))}
              </div>
              {errors.lookingFor && <span className="error-text">{errors.lookingFor}</span>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-step">
            <h2 className="step-title">What's your current situation? 💭</h2>
            <div className="form-group">
              <label>Relationship status</label>
              <div className="option-grid single-column">
                {[
                  'Single',
                  'In a relationship',
                  'Married',
                  'It\'s complicated',
                  'Prefer not to say'
                ].map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`option-button ${formData.relationshipStatus === option ? 'selected' : ''}`}
                    onClick={() => updateField('relationshipStatus', option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.relationshipStatus && <span className="error-text">{errors.relationshipStatus}</span>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="form-step">
            <h2 className="step-title">Almost there! 📧</h2>
            <p className="step-subtitle">We need your email to send you amazing matches</p>
            
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="your@email.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="divider">
              <span className="divider-text">OR</span>
            </div>

            <div className="form-group">
              <div className="google-signin-container">
                {isGoogleLoaded ? (
                  <div ref={googleButtonRef} className="google-button-wrapper"></div>
                ) : (
                  <div className="google-loading">
                    <div className="loading-spinner"></div>
                    Loading Google Sign-In...
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="form-step">
            <h2 className="step-title">Last step! 📱</h2>
            <p className="step-subtitle">Adding your phone number helps us provide better matches (optional)</p>
            <div className="form-group">
              <label>Phone number (Optional)</label>
              <div className="phone-input-container">
                <select className="country-select">
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                </select>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="Enter phone number"
                  className={errors.phone ? 'error' : ''}
                />
              </div>
              {errors.phone && <span className="error-text">{errors.phone}</span>}
              <small className="helper-text">
                💡 This helps us provide better recommendations and keep the community safe
              </small>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="basic-info-form">
      <div className="form-container">
        <div className="form-header">
          <button className="back-button" onClick={prevStep}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${(step / 6) * 100}%`}}></div>
          </div>
          <div className="step-counter">{step}/6</div>
          <button className="close-button" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="form-content">
          {isSubmitting ? (
            <div className="form-step">
              <div className="loading-state">
                <div className="loading-icon">⚡</div>
                <h2 className="loading-title">Creating Your Profile...</h2>
                <p className="loading-message">
                  We're setting up your account and getting everything ready for you. This will just take a moment!
                </p>
                <div className="loading-progress">
                  <div className="progress-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            renderStep()
          )}
        </div>

        <div className="form-footer">
          <button 
            className={`next-button ${isSubmitting ? 'loading' : ''}`} 
            onClick={nextStep}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span>Creating Profile...</span>
                <div className="loading-spinner"></div>
              </>
            ) : (
              <>
                {step === 6 ? 'Complete Setup ✨' : 'Continue'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 13h12.17l-5.59 5.59L12 20l8-8-8-8-1.41 1.41L16.17 11H4v2z"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Welcome Message Modal */}
      {showWelcomeMessage && (
        <div className="welcome-overlay">
          <div className="welcome-content">
            <div className="welcome-icon">🎉</div>
            <h2 className="welcome-title">Welcome to Match.AI!</h2>
            <p className="welcome-message">
              Your profile has been completed.<br />
              Let Match.AI find you a perfect match!
            </p>
            <div className="welcome-loader">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>We're sad to see you go! 😢</h3>
            </div>
            <div className="modal-body">
              <p>Your progress will be lost if you leave now. Come back anytime when you're ready to find amazing connections!</p>
            </div>
            <div className="modal-footer">
              <button className="modal-button secondary" onClick={cancelExit}>
                Stay & Continue
              </button>
              <button className="modal-button primary" onClick={confirmExit}>
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Error Modal */}
      <ErrorModal 
        isOpen={showServerError} 
        onOkClick={handleErrorOkClick}
      />
    </div>
  );
};

export default BasicInfoForm;