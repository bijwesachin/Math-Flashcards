const CACHE = 'flashcards-v1';
const ASSETS = [
  '/',             // if your server serves index at /
  '/index.html',
  '/styles.css',
  '/script.js',
  '/data/flashcards.json',   // your deck
  '/assets/icon.png'
  // add other critical assets as needed
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Network-first for JSON (so you can update decks), cache-first for others
  if (req.url.endsWith('.json')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
  }
});
