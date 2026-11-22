/* Guarda la Noche de Posada en el teléfono para que abra sin internet.
   Primero intenta la red (para tener siempre la versión nueva) y,
   si no hay conexión, usa la copia guardada. */
const CACHE = 'posada-v1';
const ARCHIVOS = [
  './', './index.html', './control.html', './css/navidad.css',
  './js/datos-posada.js', './js/red.js', './js/tv-posada.js', './js/juegos-extra.js', './js/dado.js', './js/control.js',
  '../css/estilo.css', '../js/comun.js', '../js/sonidos.js', '../js/vendor/qrcode.js', '../js/vendor/peerjs.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const propio = url.origin === location.origin;
  const fuente = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!propio && !fuente) return; // PeerJS y demás van directo a la red
  e.respondWith(
    fetch(e.request).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: propio }).then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
