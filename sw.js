// Service Worker: Cache-First mit Versionsstring. Bei Änderungen VERSION erhöhen (tools/bump_sw.mjs).
const VERSION = 'sr-6b4a8bf40f';
const DATEIEN = [
  './', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'data/cards.json',
  'js/store.js', 'js/ui.js', 'js/items.js',
  'js/screens/common.js', 'js/screens/station.js', 'js/screens/zimmer.js', 'js/screens/lernkarte.js',
  'js/screens/visite.js', 'js/screens/triage.js', 'js/screens/luege.js', 'js/screens/bombe.js',
  'js/screens/oberarzt.js', 'js/screens/schema.js', 'js/screens/einstellungen.js',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((treffer) => treffer || fetch(e.request).then((res) => {
      if (res.ok) { const kopie = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, kopie)); }
      return res;
    }).catch(() => (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});
