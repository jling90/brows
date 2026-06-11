/**
 * Gesture onboarding hints for the Calibration screen (issue #4): small live
 * diagrams showing what each gesture does in the game — Cart/Track tilting
 * with the brows, a mini-Maw chomping with the mouth.
 *
 * They run on PROVISIONAL signals: the relax step (always first) captures the
 * neutral baselines, after which `raw − neutral` over an assumed range gives a
 * hint whose direction is always correct even though magnitude is approximate.
 * Full Calibration is NOT required.
 */

/** Assumed raw-brow swing from neutral to a full raise/furrow (hint scaling only). */
export const ASSUMED_BROW_RANGE = 0.3
/** Assumed raw-jawOpen swing from closed to wide (hint scaling only). */
export const ASSUMED_MOUTH_RANGE = 0.5

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

/** Provisional Brow Signal in −1..1, relative to the relax-step neutral. */
export function provisionalBrow(raw: number, neutral: number): number {
  return clamp((raw - neutral) / ASSUMED_BROW_RANGE, -1, 1)
}

/** Provisional Mouth Signal in 0..1, relative to the relax-step closed value. */
export function provisionalMouth(raw: number, closed: number): number {
  return clamp((raw - closed) / ASSUMED_MOUTH_RANGE, 0, 1)
}

// --- Drawing (canvas 2D, synthwave wireframe; tutorial UI stays below gameplay brightness) ---

const TRACK = '#ff9a3c'
const CART = '#ff2bd6'
const WHEEL = '#27e7ff'
const GLOW = 6
const MAX_TILT = Math.PI / 6 // 30° at full signal

function stroke(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.strokeStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = GLOW
  ctx.lineWidth = 1.5
}

/** Cart on a track segment tilting with the brow hint signal (−1 dive … +1 climb). */
export function drawCartHint(ctx: CanvasRenderingContext2D, w: number, h: number, signal: number): void {
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(-signal * MAX_TILT) // canvas y grows downward: positive signal tilts the right end up
  stroke(ctx, TRACK)
  ctx.beginPath()
  ctx.moveTo(-w * 0.42, 12)
  ctx.lineTo(w * 0.42, 12)
  ctx.stroke()
  stroke(ctx, CART)
  ctx.beginPath() // trapezoid body, mirroring the in-game cart silhouette
  ctx.moveTo(-14, -8)
  ctx.lineTo(14, -8)
  ctx.lineTo(10, 4)
  ctx.lineTo(-10, 4)
  ctx.closePath()
  ctx.stroke()
  stroke(ctx, WHEEL)
  for (const dx of [-7, 7]) {
    ctx.beginPath()
    ctx.arc(dx, 8, 3.5, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

/** Mini-Maw whose toothy gap opens with the mouth hint signal (0 sealed … 1 wide). */
export function drawMawHint(ctx: CanvasRenderingContext2D, w: number, h: number, open: number): void {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const cy = h / 2
  const maxHalf = h * 0.32
  const half = maxHalf * clamp(open, 0, 1)
  const slabW = 30
  stroke(ctx, CART)
  for (const dir of [-1, 1] as const) {
    const edge = cy + dir * half // gap-facing edge of this slab
    const back = dir === -1 ? 0 : h
    ctx.beginPath()
    ctx.rect(cx - slabW / 2, Math.min(edge, back), slabW, Math.abs(back - edge))
    ctx.stroke()
    // 3 teeth on the gap edge — same shape language as the in-game Maw
    ctx.beginPath()
    for (const dx of [-9, 0, 9]) {
      ctx.moveTo(cx + dx - 3, edge)
      ctx.lineTo(cx + dx, edge + dir * 6)
      ctx.lineTo(cx + dx + 3, edge)
    }
    ctx.stroke()
  }
  ctx.shadowBlur = 0
}
