// Uygulamayı güncellediğinizde bu sürüm numarasını artırın.
const VERSION = "fiyat-okuyucu-v5";
const SHELL = ["./", "index.html", "liste.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
  "icons/apple-touch-icon.png", "icons/logo.png", "vendor/zxing.min.js", "vendor/xlsx.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (/\/urunler\.(enc|xlsx|csv)$/.test(url.pathname)) return;          // ürün listesi her zaman sunucudan
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(e.request, {ignoreSearch: true});
    const fresh = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => cached);
    return cached || fresh;
  }));
});
