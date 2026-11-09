import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const INPUT = 'assets-private/me.jpg'
const OUTPUT = 'src/data/dots.json'
const PREVIEW = 'assets-private/dots-preview.png'

const CROP = { left: 110, top: 160, width: 400, height: 480 }
const CELL_SIZE = 4

// Tuning: GAMMA below 1 lifts dark areas, CONTRAST stretches around mid-grey.
const GAMMA = 0.6
const CONTRAST = 1.3
const THRESHOLD = 0.285
const MEDIUM_FROM = 0.68
const LARGE_FROM = 0.83

const PREVIEW_SCALE = 2
const PREVIEW_RADII = [1.1, 2.3, 3.7]

interface DotGrid {
  w: number
  h: number
  // Flat triples of x, y and size (0, 1 or 2), which keeps the JSON small.
  d: number[]
}

function adjust(value: number): number {
  const lifted = (value / 255) ** GAMMA
  return Math.min(1, Math.max(0, (lifted - 0.5) * CONTRAST + 0.5))
}

function sizeFor(brightness: number): number {
  if (brightness >= LARGE_FROM) return 2
  return brightness >= MEDIUM_FROM ? 1 : 0
}

async function readCells(width: number, height: number): Promise<Buffer> {
  return sharp(INPUT)
    .extract(CROP)
    .greyscale()
    .resize(width, height, { fit: 'fill', kernel: 'cubic' })
    .raw()
    .toBuffer()
}

function buildGrid(cells: Buffer, w: number, h: number): DotGrid {
  const d: number[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const brightness = adjust(cells.readUInt8(y * w + x))
      if (brightness >= THRESHOLD) d.push(x, y, sizeFor(brightness))
    }
  }
  return { w, h, d }
}

async function writePreview({ w, h, d }: DotGrid): Promise<void> {
  const step = CELL_SIZE * PREVIEW_SCALE
  const circles: string[] = []
  for (let i = 0; i < d.length; i += 3) {
    const [x = 0, y = 0, size = 0] = d.slice(i, i + 3)
    const radius = PREVIEW_RADII[size] ?? 0
    circles.push(`<circle cx="${(x + 0.5) * step}" cy="${(y + 0.5) * step}" r="${radius}"/>`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * step}" height="${h * step}">
    <rect width="100%" height="100%" fill="#05020a"/><g fill="#c084fc">${circles.join('')}</g></svg>`
  await sharp(Buffer.from(svg)).png().toFile(PREVIEW)
}

const width = Math.floor(CROP.width / CELL_SIZE)
const height = Math.floor(CROP.height / CELL_SIZE)
const grid = buildGrid(await readCells(width, height), width, height)

await writeFile(OUTPUT, JSON.stringify(grid))
await writePreview(grid)
console.log(`${grid.d.length / 3} dots in a ${width}x${height} grid`)
