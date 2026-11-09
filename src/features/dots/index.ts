import dots from '../../data/dots.json'
import { createField, stepField, type Field, type Point } from './field'
import { createSprites, type Sprite } from './sprites'

const MAX_PIXEL_RATIO = 2
const MIN_CELL_PX = 3
const MAX_DT = 1 / 30
const BREATH_SPEED = 0.9
const BREATH_PX = 0.8
// Small enough that neighbouring dots move together and the grid stays even.
const PHASE_SPREAD = 0.015

export function initDots(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('.portrait')
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  let field: Field | null = null
  let sprites: Sprite[] = []
  let pointer: Point | null = null
  let frame = 0
  let lastTime = 0

  const resize = (): void => {
    const { width, height } = canvas.getBoundingClientRect()
    const pixelRatio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO)
    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    const cell = Math.min(width / dots.w, height / dots.h)
    const step = Math.max(1, Math.ceil(MIN_CELL_PX / cell))
    const offset = { x: (width - dots.w * cell) / 2, y: (height - dots.h * cell) / 2 }
    field = createField(dots, cell, step, offset)
    sprites = createSprites(cell * step, pixelRatio)
  }

  const draw = (seconds: number): void => {
    if (!field) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < field.count; i++) {
      const sprite = sprites[field.size[i] as number]
      if (!sprite) continue
      const x = field.x[i] as number
      const y = field.y[i] as number
      const home = (field.homeX[i] as number) + (field.homeY[i] as number)
      const phase = seconds * BREATH_SPEED + home * PHASE_SPREAD
      const half = sprite.size / 2
      context.drawImage(
        sprite.image,
        x + Math.cos(phase) * BREATH_PX - half,
        y + Math.sin(phase) * BREATH_PX - half,
        sprite.size,
        sprite.size,
      )
    }
  }

  const tick = (time: number): void => {
    if (field) stepField(field, Math.min((time - lastTime) / 1000, MAX_DT), pointer)
    lastTime = time
    draw(time / 1000)
    frame = requestAnimationFrame(tick)
  }

  function start(): void {
    if (frame) return
    lastTime = performance.now()
    frame = requestAnimationFrame(tick)
  }

  function stop(): void {
    cancelAnimationFrame(frame)
    frame = 0
  }

  new ResizeObserver(() => {
    resize()
    if (reducedMotion) draw(0)
  }).observe(canvas)

  if (reducedMotion) return

  new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop())).observe(canvas)

  canvas.addEventListener('pointermove', (event) => {
    pointer = { x: event.offsetX, y: event.offsetY }
  })
  for (const type of ['pointerleave', 'pointercancel']) {
    canvas.addEventListener(type, () => {
      pointer = null
    })
  }
}
