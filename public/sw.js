// BloxGain Service Worker
// Strateji: "Network-first, cache fallback". Bu, kullanıcıların her zaman
// en güncel sürümü görmesini sağlar; sadece internet bağlantısı yokken
// (offline) önbelleğe düşülür. Eski "cache-first" stratejisi, her yeni
// deploy sonrası kullanıcıların eski JS/CSS dosyalarını görmeye devam
// etmesine sebep oluyordu — bu sürümde düzeltildi.

const CACHE_NAME = 'bloxgain-v2';
const PRECACHE_ASSETS = ['/manifest.json', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API isteklerine ve GET olmayan isteklere asla dokunma — bunlar her
  // zaman doğrudan ağdan (network) gitmeli, önbelleğe alınmamalı.
  if (url.pathname.startsWith('/api/') || e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Başarılı ağ yanıtını güncel tut: önbelleğe yaz ve döndür.
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // İnternet yoksa (offline), varsa önbellekteki sürümü göster.
        return caches.match(e.request);
      })
  );
});
