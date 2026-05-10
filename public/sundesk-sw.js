const CACHE_NAME = 'sundesk-shell-v1'
const PUBLIC_ASSETS = [
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/brand/sundesk-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PUBLIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html')),
    )
    return
  }

  if (url.origin !== self.location.origin) {
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))
        }

        return response
      }).catch(() => caches.match(request)),
    )
    return
  }

  if (!PUBLIC_ASSETS.includes(url.pathname)) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => cachedResponse || fetch(request)),
  )
})
