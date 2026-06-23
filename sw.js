const CACHE = 'mymeds-v1';
const ASSETS = [
  '/mymeds/',
  '/mymeds/index.html',
  '/mymeds/css/app.css',
  '/mymeds/js/app.js',
  '/mymeds/js/store.js',
  '/mymeds/js/notify.js',
  '/mymeds/js/components/pin.js',
  '/mymeds/js/components/modals.js',
  '/mymeds/js/views/today.js',
  '/mymeds/js/views/scripts.js',
  '/mymeds/js/views/tracker.js',
  '/mymeds/js/views/collect.js',
  '/mymeds/js/views/caregiver.js',
  '/mymeds/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/mymeds/')))
  );
});
