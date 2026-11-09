export interface Grid {
  w: number
  h: number
  d: number[]
}

export interface Point {
  x: number
  y: number
}

export interface Field {
  count: number
  homeX: Float32Array
  homeY: Float32Array
  x: Float32Array
  y: Float32Array
  vx: Float32Array
  vy: Float32Array
  size: Uint8Array
}

const STIFFNESS = 70
// Critical damping: dots return as fast as possible without overshooting or shaking.
const DAMPING = 2 * Math.sqrt(STIFFNESS)
const PUSH_RADIUS = 70
const PUSH_FORCE = 5000

export function createField(grid: Grid, cell: number, step: number, offset: Point): Field {
  const home: Array<[number, number, number]> = []
  for (let i = 0; i < grid.d.length; i += 3) {
    const x = grid.d[i] ?? 0
    const y = grid.d[i + 1] ?? 0
    if (x % step !== 0 || y % step !== 0) continue
    const cellPx = cell * step
    home.push([
      offset.x + (x / step + 0.5) * cellPx,
      offset.y + (y / step + 0.5) * cellPx,
      grid.d[i + 2] ?? 0,
    ])
  }

  const homeX = Float32Array.from(home, (dot) => dot[0])
  const homeY = Float32Array.from(home, (dot) => dot[1])
  return {
    count: home.length,
    homeX,
    homeY,
    x: homeX.slice(),
    y: homeY.slice(),
    vx: new Float32Array(home.length),
    vy: new Float32Array(home.length),
    size: Uint8Array.from(home, (dot) => dot[2]),
  }
}

function pushFrom(pointer: Point, x: number, y: number): Point {
  const dx = x - pointer.x
  const dy = y - pointer.y
  const distance = Math.hypot(dx, dy)
  if (distance >= PUSH_RADIUS || distance === 0) return { x: 0, y: 0 }
  const strength = PUSH_FORCE * (1 - distance / PUSH_RADIUS)
  return { x: (dx / distance) * strength, y: (dy / distance) * strength }
}

export function stepField(field: Field, dt: number, pointer: Point | null): void {
  const { homeX, homeY, x, y, vx, vy } = field
  for (let i = 0; i < field.count; i++) {
    const px = x[i] as number
    const py = y[i] as number
    const push = pointer ? pushFrom(pointer, px, py) : { x: 0, y: 0 }
    const ax = STIFFNESS * ((homeX[i] as number) - px) - DAMPING * (vx[i] as number) + push.x
    const ay = STIFFNESS * ((homeY[i] as number) - py) - DAMPING * (vy[i] as number) + push.y
    vx[i] = (vx[i] as number) + ax * dt
    vy[i] = (vy[i] as number) + ay * dt
    x[i] = px + (vx[i] as number) * dt
    y[i] = py + (vy[i] as number) * dt
  }
}
