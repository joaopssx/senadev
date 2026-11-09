const READY_CLASS = 'blobs-ready'
const HIGH_DETAIL = 64
const LOW_DETAIL = 28
const MIN_CORES = 2
const MIN_MEMORY_GB = 2
const COMFORTABLE_CORES = 6
const IDLE_TIMEOUT_MS = 1500

function canRenderBlobs(): boolean {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const { deviceMemory = Infinity } = navigator as Navigator & { deviceMemory?: number }
  if (navigator.hardwareConcurrency <= MIN_CORES || deviceMemory <= MIN_MEMORY_GB) return false
  return document.createElement('canvas').getContext('webgl2') !== null
}

async function loadBlobs(canvas: HTMLCanvasElement): Promise<void> {
  const { startBlobs } = await import('./scene')
  const root = document.documentElement
  const detail = navigator.hardwareConcurrency >= COMFORTABLE_CORES ? HIGH_DETAIL : LOW_DETAIL
  startBlobs(canvas, detail, () => root.classList.remove(READY_CLASS))
  root.classList.add(READY_CLASS)
}

export function initBlobs(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('.blob-canvas')
  if (!canvas || !canRenderBlobs()) return

  // The CSS gradient stays in place if Three.js fails to load, so no error handling is needed here.
  const start = () => void loadBlobs(canvas)
  const startWhenIdle = () =>
    'requestIdleCallback' in window
      ? requestIdleCallback(start, { timeout: IDLE_TIMEOUT_MS })
      : start()
  addEventListener('load', startWhenIdle, { once: true })
}
