const C = "alm-cache-v2";
const A = [
  "./",
  "./index.html",
  "./manifest.json",
  "./alm/core.js",
  "./app/ui.js",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(A)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request))
  );
});
