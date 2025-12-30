const CACHE = "cpm-v3";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./sw.js"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      ),
    ])
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Network-first for navigations (HTML), so updates come through
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./", copy));
          return res;
        })
        .catch(() => caches.match("./"))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
