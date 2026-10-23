// Service Worker: Cache-First mit Versionsstring. VERSION setzt tools/bump_sw.mjs (Hash aller Dateien).
// Beim Aktivieren werden alle anderen Caches gelöscht, auch die der Version 1 („Station Recht“).
const VERSION = 'bb-b768da20e4';
const DATEIEN = [
  './', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest',
  'data/regeln.json', 'data/faelle.json', 'data/glossar.json',
  'js/store.js', 'js/daten.js', 'js/lernen.js', 'js/ui.js', 'js/ton.js', 'js/regelkarte.js',
  'js/szenen/buero.js', 'js/szenen/tag.js', 'js/szenen/schalter.js', 'js/szenen/regelbuch.js', 'js/szenen/einstellungen.js',
  'js/formate/index.js', 'js/formate/f1.js', 'js/formate/f2.js', 'js/formate/f3.js', 'js/formate/f4.js', 'js/formate/f5.js', 'js/formate/f6.js',
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
