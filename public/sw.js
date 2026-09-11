/* EcoSort AI service worker — hand-rolled, zero dependencies.
 *
 * Strategy:
 * - App shell + static assets: cache-first, refresh in background.
 * - Navigations: network-first, fall back to cache, then /offline.html.
 * - /api/*: network-only, NEVER cached (live data). Offline API failures get
 *   a synthetic JSON {ok:false, offline:true} the client already understands.
 *
 * Bump VERSION when the shell meaningfully changes; old caches are purged
 * on activate and the new worker takes over immediately.
 */
const VERSION = 'ecosort-v1'
const SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/hero.jpg',
]

self.addEventListener('install', (event) => {
  // No forced skipWaiting on failure: a failed install stays waiting and the
  // browser retries on the next navigation. Activating with a partial cache
  // would strand the app offline with half a shell.
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => precacheAssets())
      .then(() => self.skipWaiting())
  )
})

// The hashed /assets/* names aren't known at author time: scrape the live
// index.html once at install so the FIRST visit already survives an offline
// reload (runtime caching covers everything after).
function precacheAssets() {
  return fetch('/')
    .then((res) => (res && res.ok ? res.text() : ''))
    .then((html) => {
      const files = [...new Set([...html.matchAll(/\/assets\/[A-Za-z0-9_.@-]+\.(?:js|css)/g)].map((m) => m[0]))]
      if (!files.length) return
      return caches.open(VERSION).then((cache) => cache.addAll(files).catch(() => {}))
    })
    .catch(() => {})
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('ecosort-') && k !== VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ ok: false, offline: true, http: 0, error: 'backend unreachable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    )
    return
  }

  if (request.mode === 'navigate') {
    // Normalize the cache key (drop ?query): SPA rewrites serve the same
    // shell for every query string — caching each variant would bloat
    // storage unboundedly with identical responses.
    const cacheKey = new Request(url.origin + url.pathname)
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Never cache error pages: a cached 404/500 would loop offline.
          if (res && res.ok) {
            const copy = res.clone()
            caches.open(VERSION).then((cache) => cache.put(cacheKey, copy))
          }
          return res
        })
        .catch(async () => (await caches.match(cacheKey)) || (await caches.match('/offline.html')))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      const net = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copy))
          }
          return res
        })
        .catch(() => hit)
      return hit || net
    })
  )
})
