const CACHE_NAME = 'fletecol-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── INSTALACIÓN ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVACIÓN: limpia cachés viejos ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: network-first con fallback a caché ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // APIs externas: siempre red, sin caché
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('emailjs.com') ||
    url.protocol === 'chrome-extension:'
  ) {
    return; // dejar pasar sin interceptar
  }

  // Fuentes Google: cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Todo lo demás: network-first
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (event.request.method === 'GET' && res.status === 200) {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'FleteCOL', {
      body:    data.body || 'Hay una nueva ruta disponible',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-96.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
