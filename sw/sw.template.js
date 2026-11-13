// Service worker template. The build plugin in vite.config.ts replaces the
// placeholders below and emits the result as dist/sw.js.
const CACHE = 'gymtracker-__VERSION__'
const PRECACHE = __PRECACHE__

self.addEventListener('install', (event) => {
  const scope = self.registration.scope
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((p) => new URL(p, scope).href)))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  // Page loads: network first so updates arrive, cache as offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(new URL('./', self.registration.scope).href, copy))
          return res
        })
        .catch(() => caches.match(new URL('./', self.registration.scope).href)),
    )
    return
  }

  // Everything else (hashed assets, icons): cache first.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
