// Service Worker - mantiene conexión activa en background
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Interceptar fetch para que no se cancelen al cambiar pestaña
self.addEventListener('fetch', e => {
  if(e.request.url.includes('supabase.co')) {
    e.respondWith(
      fetch(e.request.clone()).catch(() => {
        return new Response(JSON.stringify({error: 'offline'}), {
          headers: {'Content-Type': 'application/json'}
        });
      })
    );
  }
});
