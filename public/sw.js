// Simple Service Worker for PWA installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin auth requests to avoid interference with Firebase Auth iframes/redirects
  if (event.request.url.includes('/__/') ||
      event.request.url.includes('apis.google.com') || 
      event.request.url.includes('identitytoolkit.googleapis.com') ||
      event.request.url.includes('google.com/js/api.js')) {
    return;
  }
  // Pass through all other requests
  event.respondWith(fetch(event.request));
});
