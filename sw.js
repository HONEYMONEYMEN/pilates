// Офлайн-режим: приложение открывается без интернета, обновления подтягиваются сами.
const CACHE = "pilates-v7";
const SHELL = ["./", "./index.html", "./firebase-config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const put = (req, res) => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return res; };
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // сеть, но не дольше 3 секунд; иначе — сохранённая копия (слабый Wi-Fi в студии)
    e.respondWith((async () => {
      const cached = await caches.match(req) || (req.mode === "navigate" ? await caches.match("./index.html") : null);
      const net = fetch(req).then(r => put(req, r));
      if (!cached) return net.catch(() => caches.match("./index.html"));
      const timeout = new Promise(r => setTimeout(() => r(cached), 3000));
      return Promise.race([net.then(r => r.ok ? r : cached).catch(() => cached), timeout]);
    })());
  } else if (url.hostname === "www.gstatic.com" || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => put(req, res))));
  }
});
