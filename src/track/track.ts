import { CAVE_HEIGHT, DX, TRACK_MAX_Y, TRACK_MIN_Y } from '../config'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const MAX_ADVANCE_PER_CALL = 100 // world units; guards against frame stalls after clock jumps

/** Sampled polyline on a fixed DX grid. Samples behind the Pen are committed and immutable. */
export class Track {
  private startX = 0
  private ys: number[]

  constructor(startY: number = CAVE_HEIGHT / 2) {
    this.ys = [startY]
  }

  get penX(): number {
    return this.startX + (this.ys.length - 1) * DX
  }

  get penY(): number {
    return this.ys[this.ys.length - 1]
  }

  /** Append samples at the given slope (dy/dx) until the Pen reaches toX. */
  advancePen(toX: number, slope: number): void {
    toX = Math.min(toX, this.penX + MAX_ADVANCE_PER_CALL)
    while (this.penX + DX <= toX) {
      this.ys.push(clamp(this.penY + slope * DX, TRACK_MIN_Y, TRACK_MAX_Y))
    }
  }

  /** Linear interpolation; clamps at both ends (returns first sample before startX, penY beyond the Pen). */
  elevationAt(x: number): number {
    const f = (x - this.startX) / DX
    const i0 = clamp(Math.floor(f), 0, this.ys.length - 1)
    const i1 = Math.min(i0 + 1, this.ys.length - 1)
    const t = clamp(f - i0, 0, 1)
    return this.ys[i0] + (this.ys[i1] - this.ys[i0]) * t
  }

  prune(minX: number): void {
    let drop = Math.floor((minX - this.startX) / DX)
    drop = Math.max(0, Math.min(drop, this.ys.length - 1))
    this.ys.splice(0, drop)
    this.startX += drop * DX
  }

  points(x0: number, x1: number): { x: number; y: number }[] {
    const out: { x: number; y: number }[] = []
    for (let i = 0; i < this.ys.length; i++) {
      const x = this.startX + i * DX
      if (x >= x0 && x <= x1) out.push({ x, y: this.ys[i] })
    }
    return out
  }
}
