// Dummy file to allow dynamic imports in eval() code to work.
// Without this the babylonjs chunk doesn't get generated since it's not actually
// imported anywhere that's visible to vite/rollup.
(async ()=>{
  // let babylon = await import('@babylonjs/core')
  let babylon = await import('./babylon')
  console.log(babylon)

  let alpine = await import('alpinejs')
  console.log(alpine)
})()

// (window as any).Alpine = Alpine
export {}