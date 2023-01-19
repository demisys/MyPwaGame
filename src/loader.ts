import Alpine from 'alpinejs'
(window as any).Alpine = Alpine
// console.log(sw)

const sw = '/sw.js'

let controllerChangePromise = new Promise((resolve)=>{
  navigator.serviceWorker.addEventListener('controllerchange', (event)=>{
    resolve(event)
  })
})

navigator.serviceWorker.register(sw, {scope: './', type: 'module'}).then(async (registration) => {
  // console.log('Service worker registration succeeded:', registration);
  let serviceWorker = await registration.installing
  if (serviceWorker) {
    // First run, service worker installing and doesn't controll this client yet.
    await controllerChangePromise
  }
  serviceWorker = await registration.active
  if (serviceWorker) {
    const importMap = {
      imports: {
        'lodash': 'https://esm.sh/lodash-es@4.17.21',
        'alpinejs': '/node_modules/alpinejs',
        '@babylonjs/core': __BABYLON_CHUNK__
      }
    }

    // TODO: Move to service worker since it handles fetching/caching resources, only pass importMap?
    const gameUrl = "/game.html"
    const gamePage = await (await fetch(gameUrl).then(v=>v.text())).replace('__IMPORT_MAP__', JSON.stringify(importMap))
    console.log(gamePage)
    serviceWorker.postMessage({
      type: 'INIT_PARAMS',
      params: {
        gamePage
      }
    })
    // Reload once service worker active.
    window.location.href = '/';
    // window.location.reload()
  }
}, (error) => {
  console.error(`Service worker registration failed: ${error}`);
})

// Alpine.start()