/* 阁子 service worker —— 构建生成，勿手改 */
const V = '575223c47f'
const STATIC = 'static-' + V
const PAGES = 'pages-v1'
const MEDIA = 'media-v1'
const PRECACHE = ["/assets/main-XIF3KO5U.css","/assets/main-FGBLRC7V.js","/assets/gl-home-HHBPXO4C.js","/assets/gl-404-L2OXET7T.js","/assets/chunk-6ATBPRIA.js","/assets/katex/katex.min.css","/assets/fonts/serif-400-d24a095c.woff2","/assets/fonts/serif-700-4cfe614b.woff2","/assets/fonts/cao-400-06bf223f.woff2"]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => ![STATIC, PAGES, MEDIA].includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

async function trim(name, max) {
  const c = await caches.open(name)
  const keys = await c.keys()
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i])
}

async function cacheFirst(req, name, max) {
  const hit = await caches.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) {
    const c = await caches.open(name)
    void c.put(req, res.clone())
    if (max) void trim(name, max)
  }
  return res
}

async function networkFirst(req) {
  try {
    const res = await fetch(req)
    if (res.ok) {
      const c = await caches.open(PAGES)
      void c.put(req, res.clone())
      void trim(PAGES, 120)
    }
    return res
  } catch (err) {
    const hit = await caches.match(req)
    if (hit) return hit
    throw err
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return
  const p = url.pathname
  if (p === '/sw.js') return
  if (p.startsWith('/assets/')) {
    e.respondWith(cacheFirst(req, STATIC))
    return
  }
  if (p.startsWith('/images/') || p.startsWith('/emoji/') || p.startsWith('/pet/')) {
    e.respondWith(cacheFirst(req, MEDIA, 300))
    return
  }
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(networkFirst(req))
  }
})
