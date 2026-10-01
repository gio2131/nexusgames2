// Ultraviolet portion of the supplied Interstellar static/sw.js.
importScripts('/assets/ultraviolet/uv.bundle.js');
importScripts('/assets/ultraviolet/uv.config.js');
importScripts(__uv$config.sw);
const uv = new UVServiceWorker();
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(location.origin + __uv$config.prefix)) event.respondWith(uv.fetch(event));
});
