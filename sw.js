// AlphaDesk service worker — Phase 6
// Caches the app shell (this HTML file, whatever it's served as) so the UI
// still loads offline. Does NOT cache API calls (price feeds, broker, GitHub,
// Supabase) — those must go to the network, and the app's own staleness
// banner already tells the user when data is old.
const CACHE_NAME = 'alphadesk-shell-v1';
const SHELL_URLS = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_URLS).catch(() => {
        // if index.html isn't at that exact path, cache-on-fetch below still works
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Only handle same-origin GET requests for the app shell itself.
  // Everything else (price APIs, broker workers, GitHub, Supabase, CDN
  // libraries) passes straight through to the network, uncached.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
