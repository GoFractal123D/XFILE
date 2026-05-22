const STATIC_CACHE = 'xfile-static-v2'
const PAGES_CACHE = 'xfile-pages-v2'

const PRECACHE = [
  '/',
  '/films',
  '/series',
  '/videos',
  '/offline',
  '/icon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE.map((path) =>
            cache.add(new Request(path, { cache: 'reload' })),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (!isSameOrigin(url)) return

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            JSON.stringify({
              ok: false,
              error: 'Vous êtes hors ligne. Les analyses nécessitent Internet.',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
      ),
    )
    return
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(networkFirst(request, STATIC_CACHE))
    return
  }

  const acceptsHtml = request.headers.get('accept')?.includes('text/html')
  if (request.mode === 'navigate' || acceptsHtml) {
    event.respondWith(networkFirstPage(request))
    return
  }
})

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const res = await fetch(request)
    if (res.ok) await cache.put(request, res.clone())
    return res
  } catch {
    return new Response('', { status: 504 })
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(request)
    if (res.ok) await cache.put(request, res.clone())
    return res
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    throw new Error('offline')
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE)
  try {
    const res = await fetch(request)
    if (res.ok && res.type === 'basic') {
      await cache.put(request, res.clone())
    }
    return res
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    const offline = await cache.match('/offline')
    if (offline) return offline
    const home = await caches.open(STATIC_CACHE).then((c) => c.match('/'))
    if (home) return home
    return new Response(
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>XFILE hors ligne</title></head><body style="font-family:system-ui;background:#0a0a14;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem"><div><h1>Hors ligne</h1><p>Ouvrez <a href="/offline" style="color:#5eead4">Bibliothèque hors ligne</a></p></div></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }
}
