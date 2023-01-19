// import Alpine from 'alpinejs'

// For debugging, let Alpine be used in console
// window.Alpine = Alpine

const supportsWebGPU = 'gpu' in navigator

export let html = /* html */`
<div class="container" x-data="$store.frameData">
	<p>
	Engine: <span x-data="$store.babylonInfo" x-text="name"></span>
	<br>
	FPS: <span x-text="fps.toFixed(1)"></span> (<span x-text="avgFps.toFixed(1)"></span>)
	<br>
	frametime: <span x-text="avgFrametime.toFixed(2)"></span> ms
	</p>
</div>
`
console.log('init store!')
Alpine.store('frameData', {
	fps: 0, avgFps: 0, avgFrametime: 0,

	update(fps, avgFrametime) {
		this.fps = fps
		this.avgFrametime = avgFrametime
		if (avgFrametime > 0)
			this.avgFps = 1000 / avgFrametime
	}
})
Alpine.store('babylonInfo', {
	name: '',
	update(engine: Engine | WebGPUEngine) {
		this.name = engine.name
	}
})

export async function start(canvas: HTMLCanvasElement) {
	// Dynamic import babylon to make use of import split in vite.
	let { Engine, WebGPUEngine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } = await import('@babylonjs/core');
	
	// Alpine.start()

	// Generate the BABYLON 3D engine
	console.log('engine...')
	const engine = supportsWebGPU ? await (async ()=>{
		const e = new WebGPUEngine(canvas, {
			antialiasing: true
		})
		// TODO: install glslang/twgsl from npm (not available yet?) or as subprojects
		await e.initAsync({
			jsPath: '/glslang.js',
			wasmPath: '/glslang.wasm'
		}, {
			jsPath: '/twgsl.js',
			wasmPath: '/twgsl.wasm'
		})
		return e
	})() : new Engine(canvas, true)

	Alpine.store('babylonInfo').update(engine)

	const createScene = function () {
		// Creates a basic Babylon Scene object
		const scene = new Scene(engine)
		// Creates and positions a free camera
		const camera = new FreeCamera("camera1", 
		new Vector3(0, 5, -10), scene)
		// Targets the camera to scene origin
		camera.setTarget(Vector3.Zero())
		// This attaches the camera to the canvas
		camera.attachControl(canvas, true)
		// Creates a light, aiming 0,1,0 - to the sky
		const light = new HemisphericLight("light",
		new Vector3(0, 1, 0), scene)
		// Dim the light a small amount - 0 to 1
		light.intensity = 0.7
		// Built-in 'sphere' shape.
		const sphere = MeshBuilder.CreateSphere("sphere", 
		{diameter: 2, segments: 32}, scene)
		// Move the sphere upward 1/2 its height
		sphere.position.y = 1

		const otherSphere = MeshBuilder.CreateSphere("sphere", 
		{diameter: 1.5, segments: 32}, scene)
		// Move the sphere upward 1/2 its height
		otherSphere.position.x = 2
		otherSphere.position.y = 0.75
		// Built-in 'ground' shape.
		const ground = MeshBuilder.CreateGround("ground", 
		{width: 6, height: 6}, scene)
		return scene
	}
	const scene = createScene() //Call the createScene function
	// Register a render loop to repeatedly render the scene
	let frametimes: Array<number> = []
	let fpsUpdate = performance.now()
	engine.runRenderLoop(function () {
		scene.render()
		const now = performance.now()
		frametimes.push(now)
		if (now > fpsUpdate) {
			fpsUpdate += 200

			const then = now - 5000
			let i = frametimes.findIndex(v=> v > then)
			if (i > 0)
				frametimes = frametimes.slice(i)
			if (now - then > 0) {
				Alpine.store('frameData').update(engine.getFps(), (now - frametimes[0]) / frametimes.length)
			} else {
				Alpine.store('frameData').update(engine.getFps(), 0)
			}
			
		}
	})
	// Watch for browser/canvas resize events
	window.addEventListener("resize", function () {
		engine.resize()
	})
}