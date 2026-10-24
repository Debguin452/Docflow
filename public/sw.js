/* Filedit service worker
 *  - /assets/*  (content-hashed, immutable)   → cache-first
 *  - OCR / background-removal models (CDNs)    → cache-first (large, versioned, rarely change)
 *  - Google Fonts                              → stale-while-revalidate
 *  - Page navigations                          → network-first, offline fallback to cached shell
 *  - /api/*                                    → never touched
 */
const VERSION = 'v1'
const STATIC = `filedit-static-${VERSION}`
const RUNTIME = `filedit-runtime-${VERSION}`
const SHELL = `filedit-shell-${VERSION}`
const KEEP = [STATIC, RUNTIME, SHELL]

const MODEL_HOSTS = ['cdn.jsdelivr.net', 'tessdata.projectnaptha.com', 'staticimgly.com']
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']
const MAX_STATIC_ENTRIES = 160

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter(n => n.startsWith('filedit-') && !KEEP.includes(n)).map(n => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

const cacheable = res => res && (res.ok || res.type === 'opaque')

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)))
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (cacheable(res)) {
    cache.put(request, res.clone())
    if (maxEntries) trim(cacheName, maxEntries)
  }
  return res
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  const refresh = fetch(request)
    .then(res => { if (cacheable(res)) cache.put(request, res.clone()); return res })
    .catch(() => hit)
  return hit || refresh
}

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL)
  try {
    const res = await fetch(request)
    // The app is a SPA: every route serves the same shell, so keep one copy
    if (res.ok) cache.put('/', res.clone())
    return res
  } catch {
    return (await cache.match('/')) || Response.error()
  }
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin

  if (sameOrigin && url.pathname.startsWith('/api/')) return
  if (request.headers.has('range')) return // let the browser handle partial requests

  if (sameOrigin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, STATIC, MAX_STATIC_ENTRIES))
  } else if (MODEL_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, RUNTIME))
  } else if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME))
  } else if (sameOrigin && request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
  }
})
