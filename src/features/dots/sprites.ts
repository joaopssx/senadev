const COLORS = ['#7c3aed', '#9e5ff4', '#c084fc']
const RADIUS_RATIOS = [0.2, 0.34, 0.48]
const GLOW_RATIO = 0.5

export interface Sprite {
  image: HTMLCanvasElement
  size: number
}

// Drawing thousands of arcs with shadowBlur every frame is slow, so each dot size is pre-drawn once.
function createSprite(radius: number, color: string, pixelRatio: number): Sprite {
  const glow = radius * GLOW_RATIO
  const size = (radius + glow) * 2
  const image = document.createElement('canvas')
  image.width = image.height = Math.ceil(size * pixelRatio)

  const context = image.getContext('2d')
  if (context) {
    const center = image.width / 2
    context.fillStyle = color
    context.shadowColor = color
    context.shadowBlur = glow * pixelRatio
    context.beginPath()
    context.arc(center, center, radius * pixelRatio, 0, Math.PI * 2)
    context.fill()
  }
  return { image, size }
}

export function createSprites(cell: number, pixelRatio: number): Sprite[] {
  return RADIUS_RATIOS.map((ratio, index) =>
    createSprite(cell * ratio, COLORS[index] ?? '#c084fc', pixelRatio),
  )
}
