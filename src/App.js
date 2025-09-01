import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AutoLogin from './components/AutoLogin';
import './App.css';

function App() {
  
  // PWA-specific setup
  useEffect(() => {
    // Handle PWA display mode
    const checkDisplayMode = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      if (isStandalone || isFullscreen || isMinimalUI) {
        console.log('📱 App is running in PWA mode');
        document.body.classList.add('pwa-mode');
      } else {
        console.log('🌐 App is running in browser mode');
        document.body.classList.add('browser-mode');
      }
    };

    // Check display mode on load
    checkDisplayMode();

    // Handle iOS PWA status bar
    if (window.navigator.standalone) {
      console.log('📱 Running as iOS PWA');
      document.body.classList.add('ios-pwa');
    }

    // Handle PWA theme changes
    const updateThemeColor = (color) => {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', color);
      }
    };

    // Set initial theme color
    updateThemeColor('#7c3aed');

    // Handle visibility changes for PWA
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📴 PWA is in background');
      } else {
        console.log('📱 PWA is in foreground');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle PWA keyboard shortcuts (optional)
  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      // Example: Ctrl+M to open matches (for PWA)
      if (e.ctrlKey && e.key === 'm') {
        console.log('🔥 Keyboard shortcut: Open matches');
        // You can dispatch custom events here for navigation
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);

    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, []);

  return (
    <div className="App">
    <div id="chat-portal-root"></div>
      <Router>
        <Routes>
          {/* Auto-Login Route for Email Links */}
          <Route path="/auto-login" element={<AutoLogin />} />
          
          {/* Everything else goes to your existing LandingPage */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;