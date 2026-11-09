import {
  ACESFilmicToneMapping,
  Color,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  Vector3,
  WebGLRenderer,
  type MeshPhysicalMaterial,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createBlobMaterial, type BlobUniforms } from './material'

interface Palette {
  color: string
  amplitude: number
}

interface Blob {
  mesh: Mesh<IcosahedronGeometry, MeshPhysicalMaterial>
  slot: Element
  uniforms: BlobUniforms
  shape: Vector3
  sway: number
}

const palettes: Record<string, Palette> = {
  home: { color: '#5b21b6', amplitude: 0.3 },
  about: { color: '#7e22ce', amplitude: 0.34 },
  skills: { color: '#3730a3', amplitude: 0.26 },
  projects: { color: '#6d28d9', amplitude: 0.32 },
  guestbook: { color: '#9d174d', amplitude: 0.28 },
  contact: { color: '#6b21a8', amplitude: 0.36 },
}

const MAX_PIXEL_RATIO = 2
const CAMERA_FOV = 35
const CAMERA_DISTANCE = 8
const OFFSCREEN_MARGIN_PX = 120
const SLOT_FILL = 0.78
const EASING_PER_SECOND = 2.5
const LIGHT_SPREAD = 4
const EXPOSURE = 0.85

function createBlob(
  slotSelector: string,
  detail: number,
  shape: Vector3,
  seed: number,
  frequency: number,
  sway: number,
): Blob | null {
  const slot = document.querySelector(slotSelector)
  if (!slot) return null
  const uniforms: BlobUniforms = {
    uTime: { value: 0 },
    uAmplitude: { value: palettes.home?.amplitude ?? 0 },
    uFrequency: { value: frequency },
    uSeed: { value: seed },
  }
  const material = createBlobMaterial(uniforms)
  material.color.set(palettes.home?.color ?? '#7c3aed')
  return {
    mesh: new Mesh(new IcosahedronGeometry(1, detail), material),
    slot,
    uniforms,
    shape,
    sway,
  }
}

function addLight(scene: Scene, color: string, intensity: number, z: number): PointLight {
  const light = new PointLight(color, intensity)
  light.position.z = z
  scene.add(light)
  return light
}

function watchActivePalette(onChange: (palette: Palette) => void): void {
  const observer = new IntersectionObserver(
    (entries) => {
      const active = entries.find((entry) => entry.isIntersecting)
      const palette = active && palettes[active.target.id]
      if (palette) onChange(palette)
    },
    { rootMargin: '-50% 0px -50% 0px' },
  )
  document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section))
}

export function startBlobs(canvas: HTMLCanvasElement, detail: number, onLost: () => void): void {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = EXPOSURE
  renderer.setPixelRatio(Math.min(devicePixelRatio, MAX_PIXEL_RATIO))

  const scene = new Scene()
  scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 50)
  camera.position.z = CAMERA_DISTANCE

  const mouseLight = addLight(scene, '#f0409c', 70, 3)
  const driftLight = addLight(scene, '#4f7cff', 160, 3.5)
  const warmLight = addLight(scene, '#ffae7a', 55, 2.5)
  warmLight.position.set(1.5, -3, 2.5)

  const blobs = [
    createBlob('.blob-fallback--hero', detail, new Vector3(1.25, 0.95, 0.75), 1.7, 0.62, 0.5),
    createBlob('.blob-fallback--about', detail, new Vector3(0.9, 1.3, 0.7), 8.3, 0.8, -0.4),
  ].filter((blob) => blob !== null)
  blobs.forEach((blob) => scene.add(blob.mesh))

  const pointer = { x: 0.4, y: 0.2 }
  const targetColor = new Color(palettes.home?.color)
  let targetAmplitude = palettes.home?.amplitude ?? 0
  let lastTime = performance.now()
  let renderedBlobs = false
  let frame = 0

  function resize(): void {
    renderer.setSize(innerWidth, innerHeight, false)
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
  }

  function placeBlob(blob: Blob, worldPerPixel: number, seconds: number): boolean {
    const rect = blob.slot.getBoundingClientRect()
    const onScreen =
      rect.bottom > -OFFSCREEN_MARGIN_PX && rect.top < innerHeight + OFFSCREEN_MARGIN_PX
    blob.mesh.visible = onScreen
    if (!onScreen) return false

    const centerY = rect.top + rect.height / 2
    const scroll = (innerHeight / 2 - centerY) / innerHeight
    blob.mesh.position.set(
      (rect.left + rect.width / 2 - innerWidth / 2) * worldPerPixel + scroll * blob.sway,
      (innerHeight / 2 - centerY) * worldPerPixel,
      0,
    )
    blob.mesh.scale.copy(blob.shape).multiplyScalar((rect.width / 2) * worldPerPixel * SLOT_FILL)
    blob.mesh.rotation.set(scroll * 0.6, seconds * 0.06 + scroll * 1.4, scroll * 0.5)
    blob.uniforms.uTime.value = seconds
    return true
  }

  function render(time: number): void {
    frame = requestAnimationFrame(render)
    const seconds = time / 1000
    const ease = Math.min(1, ((time - lastTime) / 1000) * EASING_PER_SECOND)
    lastTime = time

    const worldHeight = 2 * CAMERA_DISTANCE * Math.tan((CAMERA_FOV * Math.PI) / 360)
    const worldPerPixel = worldHeight / innerHeight
    const anyVisible = blobs.map((blob) => placeBlob(blob, worldPerPixel, seconds)).some(Boolean)
    if (!anyVisible && !renderedBlobs) return
    renderedBlobs = anyVisible

    for (const blob of blobs) {
      blob.mesh.material.color.lerp(targetColor, ease)
      blob.uniforms.uAmplitude.value += (targetAmplitude - blob.uniforms.uAmplitude.value) * ease
    }

    const halfWidth = (worldHeight * camera.aspect) / 2
    mouseLight.position.x += (pointer.x * halfWidth - mouseLight.position.x) * ease
    mouseLight.position.y += (pointer.y * (worldHeight / 2) - mouseLight.position.y) * ease
    driftLight.position.x = Math.cos(seconds * 0.25) * LIGHT_SPREAD
    driftLight.position.y = Math.sin(seconds * 0.33) * LIGHT_SPREAD * 0.7

    renderer.render(scene, camera)
  }

  addEventListener('resize', resize)
  addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / innerWidth) * 2 - 1
    pointer.y = 1 - (event.clientY / innerHeight) * 2
  })
  canvas.addEventListener('webglcontextlost', () => {
    cancelAnimationFrame(frame)
    onLost()
  })
  watchActivePalette((palette) => {
    targetColor.set(palette.color)
    targetAmplitude = palette.amplitude
  })

  resize()
  frame = requestAnimationFrame(render)
}
