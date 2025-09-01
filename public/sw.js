const CACHE_NAME = 'match-ai-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// Check if we're in development mode
const isDevelopment = self.location.hostname === 'localhost' || 
                     self.location.hostname === '127.0.0.1' ||
                     self.location.port === '3000';

console.log(`🔧 Service Worker: Running in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing');
  
  if (isDevelopment) {
    // In development, skip caching and activate immediately
    console.log('🚀 Development mode: Skipping cache installation');
    self.skipWaiting();
    return;
  }
  
  // Production caching
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching files for production');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  
  if (isDevelopment) {
    // In development, clear all caches and claim clients immediately
    console.log('🧹 Development mode: Clearing all caches');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🗑️ Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('✨ All caches cleared for development');
      })
    );
  } else {
    // Production cache management
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
  
  self.clients.claim();
});

// Fetch event - Modified for development
self.addEventListener('fetch', (event) => {
  if (isDevelopment) {
    // In development, always fetch from network (no caching)
    console.log('🌐 Development mode: Fetching from network:', event.request.url);
    event.respondWith(
      fetch(event.request).catch(() => {
        // Only fallback for navigation requests
        if (event.request.destination === 'document') {
          return fetch('/');
        }
        throw new Error('Network request failed');
      })
    );
    return;
  }
  
  // Production caching strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('📦 Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('🌐 Fetching from network:', event.request.url);
        return fetch(event.request);
      })
      .catch(() => {
        // Fallback for offline functionality
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Enhanced Push notification handling (works in both modes)
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received', event);
  
  let notificationData = {
    title: 'Match.AI',
    body: 'You have new matches!',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'match-notification',
    requireInteraction: true,
    data: {
      url: '/',
      type: 'match'
    },
    actions: [
      {
        action: 'view',
        title: 'View Matches',
        icon: '/logo192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('📧 Push data received:', pushData);
      
      // Customize notification based on push data
      if (pushData.title) notificationData.title = pushData.title;
      if (pushData.body) notificationData.body = pushData.body;
      if (pushData.matchCount) {
        notificationData.body = `You have ${pushData.matchCount} new match${pushData.matchCount > 1 ? 'es' : ''}!`;
      }
      if (pushData.data) notificationData.data = { ...notificationData.data, ...pushData.data };
      
    } catch (error) {
      console.error('❌ Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('✅ Notification displayed successfully');
      })
      .catch((error) => {
        console.error('❌ Error showing notification:', error);
      })
  );
});

// Enhanced Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  
  if (action === 'dismiss') {
    return;
  }
  
  const urlToOpen = action === 'view' ? '/#/matches' : (notificationData.url || '/');
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          console.log('📱 Focusing existing window');
          return client.focus().then(() => {
            return client.postMessage({
              type: 'NAVIGATE',
              url: urlToOpen,
              notificationData: notificationData
            });
          });
        }
      }
      
      console.log('🆕 Opening new window');
      return clients.openWindow(urlToOpen);
    }).catch((error) => {
      console.error('❌ Error handling notification click:', error);
    })
  );
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Development helper: Force cache clear
  if (event.data && event.data.type === 'CLEAR_CACHE' && isDevelopment) {
    console.log('🧹 Clearing caches on request');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('✨ All caches cleared');
      // Notify the app that caches are cleared
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      });
    });
  }
});

// Background sync for offline actions (production only)
self.addEventListener('sync', (event) => {
  if (isDevelopment) {
    console.log('🔄 Background sync skipped in development mode');
    return;
  }
  
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      Promise.resolve()
    );
  }
});