/// <reference lib="webworker" />

import JSZip from 'jszip'

const errorPage = /* html */`
<html lang="en">
<head>
<meta charset="UTF-8" />
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Error</title>
<script type="module" src="/@vite/client"></script>
</head>
<body>
<div id="app">Error</div>
</body>
</html>`

const CACHE_NAME = "my_cache"

async function loadCacheFromZip(zip) {
  console.log('sw: got zip', zip)
  const cache = await caches.open(CACHE_NAME);
  zip.forEach(async (path, file)=>{
    const url = path.slice(4)
    console.log(`sw: caching ${url}`)
    const data = await file.async('blob')
    let mimeType = 'application/json'

    if (path.endsWith('.js')) {
      mimeType = 'text/javascript'
    } else if (path.endsWith('.wasm')) {
      mimeType = 'application/wasm'
    } else if (path.endsWith('.html')) {
      mimeType = 'text/html'
    } else if (path.endsWith('.svg')) {
      mimeType = 'image/svg+xml'
    } else if (path.endsWith('css')) {
      mimeType = 'text/css'
    }
    const response = new Response(data, {
      headers: {
        'Content-Type': mimeType
      }
    })
    cache.put(url, response)
  })
}

self.addEventListener('install', (event) => {
  
  console.log('sw: Service worker installed...')
  console.log(event)
  
  // Get archive of all files from server.
  // TODO: encode zip directly in this .js file?
  event.waitUntil(fetch('/dist.zip').then(r=>{
    if (r.ok) {
      r.blob().then(JSZip.loadAsync).then(loadCacheFromZip)
    }
  }))
  
  // Load cache from archive.
  
  // Immediately reload.
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  console.log('sw: Service worker active!')
  console.log(event)
  
  console.log('sw: clients claim!')
  
  // TODO: Is this needed?
  event.waitUntil(self.clients.claim())
  self.skipWaiting()
})

self.addEventListener('push', (event) => {
  console.log('sw: Service worker push...')
  console.log(event)
})


let gamePage = null
self.addEventListener('message', (event) => {
  console.log('sw event: ')
  console.log(event)
  
  if (event.data) switch(event.data.type) {
    case 'SKIP_WAITING':
    self.skipWaiting()
    break
    case 'INIT_PARAMS':
    console.log('service worker params:')
    console.log(event.data.params)
    gamePage = event.data.params.gamePage
    break
  }
})

self.addEventListener('fetch', event => {
  let r = event.request
  
  const url = new URL(r.url)
  if (url.origin === location.origin) {
    // home or article pages
    //if (url.pathname === '/' || /^\/20\d\d\/[a-z0-9-]+\/$/.test(url.pathname)) {
    //if (url.pathname === '/' || r.mode == 'navigate') {
    if (url.pathname === '/' || url.pathname === '/test') {
      
      console.log('game page???')
      console.log(gamePage)
      if (gamePage) {
        const response = new Response(gamePage, {
          headers: {'Content-Type': 'text/html'}
        })
        event.respondWith(response)
        return
      }
    }
  }
  event.respondWith( 
    caches
    .match(event.request)
    .then(cachedRes => {
      if (cachedRes) {
        console.log(`sw: Got cached result for: ${r.url}`)
        return cachedRes;
      } else {
        throw new Error('No match found in cache!');
      }
    }).catch(() => {
      console.log(`sw: No cached result: ${r.url}`)
      return fetch(event.request);
    })
  )
})