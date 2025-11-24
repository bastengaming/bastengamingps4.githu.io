// placeholder service worker - optional for advanced caching
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('basten-1100-v1').then(function(cache) {
      return cache.addAll(['/ps4hen/1100/index.html']);
    })
  );
});
