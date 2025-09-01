import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './AutoLogin.css';
import ErrorModal from './ErrorModal';

const AutoLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('');
  const [showServerError, setShowServerError] = useState(false);

  const handleErrorOkClick = () => {
    setShowServerError(false);
    // Just close the error modal, user stays on the current page
  };

  useEffect(() => {
    // Check if user is already authenticated when component loads
    const checkExistingAuth = () => {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        try {
          JSON.parse(storedProfile);
          navigate('/', { replace: true });
          return true;
        } catch (error) {
          console.error('Error parsing stored profile:', error);
          localStorage.removeItem('userProfile');
        }
      }
      return false;
    };

    // If user already authenticated, redirect immediately
    if (checkExistingAuth()) {
      return;
    }

    const handleAutoLogin = async () => {
      const token = searchParams.get('token');


      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing authentication token');
        setTimeout(() => {
          navigate('/?message=invalid_token');
        }, 2000);
        return;
      }

      try {
        setStatus('processing');
        setMessage('Verifying your access...');
        
        
        // UPDATED: Changed API endpoint to match backend
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/verify-email-token`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ token })
        });


        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const { user, matches, authToken } = result; // NEW: Extract matches from response
        
        // Store authentication data (same as your LandingPage sign-in)
        localStorage.setItem('userProfile', JSON.stringify(user));
        if (authToken) {
          localStorage.setItem('authToken', authToken);
        }
        
        // NEW: Store matches data if present (for one-time notification)
        if (matches && matches.totalCount > 0) {
          localStorage.setItem('matchesData', JSON.stringify(matches));
          setMessage(`Welcome back, ${user.firstName}! You have ${matches.totalCount} new match${matches.totalCount > 1 ? 'es' : ''} waiting!`);
        } else {
          setMessage(`Welcome back, ${user.firstName}!`);
        }
        
        setStatus('success');
        
        // Redirect to landing page - your existing logic will show dashboard
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
        
      } catch (error) {
        console.error('❌ Auto-login failed:', error);
        setStatus('error');
        setShowServerError(true);
        
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          setMessage('This email link has expired for your security');
        } else {
          setMessage('Unable to verify your access');
        }
        
        setTimeout(() => {
          navigate('/?message=session_expired');
        }, 3000);
      }
    };

    handleAutoLogin();
  }, [searchParams, navigate]);

  return (
    <div className="auto-login-page">
      <div className="auto-login-container">
        {status === 'processing' && (
          <div className="auto-login-processing">
            <div className="auto-login-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <h2>Signing you in...</h2>
            <p>{message || 'Please wait while we verify your access.'}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="auto-login-success">
            <div className="success-icon">✅</div>
            <h2>{message}</h2>
            <p>Taking you to your dashboard...</p>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="auto-login-error">
            <div className="error-icon">❌</div>
            <h2>Authentication Failed</h2>
            <p>{message}</p>
            <div className="redirect-info">
              <p>Redirecting to sign in page...</p>
              <button 
                className="signin-button"
                onClick={() => navigate('/')}
              >
                Go to Sign In Now
              </button>
            </div>
          </div>
        )}
      </div>

      <ErrorModal 
        isOpen={showServerError} 
        onOkClick={handleErrorOkClick}
      />
    </div>
  );
};

export default AutoLogin;