const CACHE_NAME = 'bloxgain-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png'
];

// Install Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Service Worker
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Assets or Pass API
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Do not intercept or cache server API routes or non-GET requests
  if (url.pathname.startsWith('/api/') || e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        // Cache newly fetched static assets on the go
        if (response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Fallback or offline page
      });
    })
  );
});
