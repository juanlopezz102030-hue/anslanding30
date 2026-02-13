const CACHE_NAME = 'cayo-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/cayo.webp',
  '/fondo.webp',
  '/bet30.webp',
  '/ganamos.webp',
  '/brou.webp',
  '/itau.webp',
  '/midinero.webp',
  '/mercadopago.webp',
  '/prex.webp',
  '/santander.webp',
  '/scotiabank.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
