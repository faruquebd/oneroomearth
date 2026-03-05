const CACHE = 'oneroomearth-v1';
const OFFLINE_ASSETS = [
  'https://oneroomearth.com/',
  'https://oneroomearth.com/index.html',
  'https://oneroomearth.com/manifest.json',
  'https://oneroomearth.com/icons/icon-192.png',
  'https://oneroomearth.com/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;600;700&display=swap',
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e => {
  // Don't intercept Supabase or Anthropic API calls
  if (e.request.url.includes('supabase.co') || e.request.url.includes('anthropic.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful GET responses
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => {
        if (cached) return cached;
        // Offline fallback for navigation
        if (e.request.mode === 'navigate') return caches.match('/index.html');
      }))
  );
});
