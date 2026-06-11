import { FaceLandmarker } from '@mediapipe/tasks-vision'

/**
 * Particle sparks for the Calibration screen (issue #3): emitted around the
 * facial feature being measured (brows or lips), anchored to live landmarks.
 * Pure logic — drawing happens in calibrationScreen. Coordinates are in
 * normalized landmark space (0..1 of the video frame).
 */

const uniqueIndices = (conns: ReadonlyArray<{ start: number; end: number }>): number[] => {
  const s = new Set<number>()
  for (const c of conns) {
    s.add(c.start)
    s.add(c.end)
  }
  return [...s]
}

/** Landmark indices for both eyebrows, derived from MediaPipe's connection sets. */
export const BROW_INDICES: number[] = [
  ...uniqueIndices(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW),
  ...uniqueIndices(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW),
]

/** Landmark indices for the lips. */
export const LIP_INDICES: number[] = uniqueIndices(FaceLandmarker.FACE_LANDMARKS_LIPS)

export interface Anchor {
  x: number
  y: number
}

/** Copies xy positions for `indices` out of the shared flat xyz landmark buffer. */
export function anchorsFrom(landmarks: Float32Array, indices: number[]): Anchor[] {
  return indices.map((i) => ({ x: landmarks[i * 3], y: landmarks[i * 3 + 1] }))
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  /** 0..2 — index into the synthwave palette (magenta/orange/cyan). */
  paletteIndex: number
}

/** Particles per second at zero signal intensity (idle shimmer). */
export const BASE_RATE = 6
/** Additional particles per second at full signal intensity. */
export const FULL_RATE = 90
/** Hard cap so a long step can never grow the field unbounded. */
export const MAX_PARTICLES = 240

const MIN_LIFE = 0.35
const MAX_LIFE = 0.75
const JITTER = 0.015 // spawn scatter, normalized units
const SPEED = 0.06 // outward drift, normalized units/s

export class ParticleField {
  readonly particles: Particle[] = []
  private carry = 0

  constructor(private rng: () => number = Math.random) {}

  /**
   * Emit sparks around `anchors` for this frame. `intensity` (0..1, clamped)
   * scales the rate so emission doubles as is-the-tracker-seeing-you feedback.
   */
  emit(anchors: Anchor[], intensity: number, dt: number): void {
    if (anchors.length === 0) return
    const k = Math.min(1, Math.max(0, intensity))
    this.carry += (BASE_RATE + FULL_RATE * k) * dt
    let n = Math.floor(this.carry)
    this.carry -= n
    n = Math.min(n, MAX_PARTICLES - this.particles.length)
    for (let i = 0; i < n; i++) {
      const a = anchors[Math.floor(this.rng() * anchors.length) % anchors.length]
      const ang = this.rng() * Math.PI * 2
      const speed = SPEED * (0.3 + 0.7 * this.rng())
      this.particles.push({
        x: a.x + (this.rng() - 0.5) * 2 * JITTER,
        y: a.y + (this.rng() - 0.5) * 2 * JITTER,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - SPEED * 0.4, // slight upward drift
        age: 0,
        life: MIN_LIFE + (MAX_LIFE - MIN_LIFE) * this.rng(),
        paletteIndex: Math.floor(this.rng() * 3) % 3,
      })
    }
  }

  /** Advance and expire particles. */
  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.age += dt
      if (p.age >= p.life) {
        this.particles.splice(i, 1)
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
  }
}
