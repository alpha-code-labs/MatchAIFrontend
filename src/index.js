import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 New service worker version available');
        });
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Handle PWA install prompt (fallback for browsers that don't support beforeinstallprompt)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 beforeinstallprompt event fired');
  e.preventDefault();
  deferredPrompt = e;
});

// Handle successful PWA installation
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA was installed successfully');
  deferredPrompt = null;
});

// Handle online/offline status for PWA
window.addEventListener('online', () => {
  console.log('🌐 App is online');
});

window.addEventListener('offline', () => {
  console.log('📴 App is offline');
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();