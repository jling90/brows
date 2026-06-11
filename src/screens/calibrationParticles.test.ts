import { describe, expect, it } from 'vitest'
import {
  anchorsFrom,
  BASE_RATE,
  BROW_INDICES,
  FULL_RATE,
  LIP_INDICES,
  MAX_PARTICLES,
  ParticleField,
} from './calibrationParticles'

/** Deterministic rng cycling through fixed values. */
const fixedRng = (v = 0.5) => () => v

const ANCHOR = [{ x: 0.5, y: 0.5 }]

describe('landmark index sets', () => {
  it('brow and lip index sets are non-empty and within the 478-point mesh', () => {
    expect(BROW_INDICES.length).toBeGreaterThan(0)
    expect(LIP_INDICES.length).toBeGreaterThan(0)
    for (const i of [...BROW_INDICES, ...LIP_INDICES]) {
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(478)
    }
  })

  it('brow indices cover both eyebrows (disjoint left/right clusters exist)', () => {
    // The mesh numbers the two brows in distinct index ranges; a single-brow
    // regression would collapse the spread.
    const min = Math.min(...BROW_INDICES)
    const max = Math.max(...BROW_INDICES)
    expect(max - min).toBeGreaterThan(100)
  })
})

describe('anchorsFrom', () => {
  it('maps flat xyz landmark buffer to xy anchors by index', () => {
    const buf = new Float32Array(478 * 3)
    buf[7 * 3] = 0.25
    buf[7 * 3 + 1] = 0.75
    const [a] = anchorsFrom(buf, [7])
    expect(a).toEqual({ x: 0.25, y: 0.75 })
  })

  it('copies values out of the shared buffer (later mutation does not affect anchors)', () => {
    const buf = new Float32Array(478 * 3)
    buf[3] = 0.25 // exactly representable in float32
    const [a] = anchorsFrom(buf, [1])
    buf[3] = 0.75
    expect(a.x).toBe(0.25)
  })
})

describe('ParticleField emission', () => {
  it('emits at the base rate when intensity is 0', () => {
    const f = new ParticleField(fixedRng())
    f.emit(ANCHOR, 0, 1.0)
    expect(f.particles.length).toBe(Math.floor(BASE_RATE))
  })

  it('emits at base + full rate when intensity is 1', () => {
    const f = new ParticleField(fixedRng())
    f.emit(ANCHOR, 1, 1.0)
    expect(f.particles.length).toBe(Math.floor(BASE_RATE + FULL_RATE))
  })

  it('clamps intensity above 1', () => {
    const a = new ParticleField(fixedRng())
    const b = new ParticleField(fixedRng())
    a.emit(ANCHOR, 1, 1.0)
    b.emit(ANCHOR, 5, 1.0)
    expect(b.particles.length).toBe(a.particles.length)
  })

  it('accumulates fractional emission across small dt steps', () => {
    const f = new ParticleField(fixedRng())
    for (let i = 0; i < 60; i++) f.emit(ANCHOR, 0, 1 / 60)
    // 60 * (BASE_RATE/60) = BASE_RATE total, within one particle of exact
    expect(f.particles.length).toBeGreaterThanOrEqual(Math.floor(BASE_RATE) - 1)
    expect(f.particles.length).toBeLessThanOrEqual(Math.ceil(BASE_RATE))
  })

  it('never exceeds MAX_PARTICLES', () => {
    const f = new ParticleField(fixedRng())
    for (let i = 0; i < 100; i++) f.emit(ANCHOR, 1, 1.0)
    expect(f.particles.length).toBeLessThanOrEqual(MAX_PARTICLES)
  })

  it('emits nothing when there are no anchors (no face)', () => {
    const f = new ParticleField(fixedRng())
    f.emit([], 1, 1.0)
    expect(f.particles.length).toBe(0)
  })

  it('spawns particles near their anchor', () => {
    const f = new ParticleField(fixedRng(0.9))
    f.emit([{ x: 0.3, y: 0.6 }], 1, 0.5)
    for (const p of f.particles) {
      expect(Math.abs(p.x - 0.3)).toBeLessThan(0.05)
      expect(Math.abs(p.y - 0.6)).toBeLessThan(0.05)
    }
  })
})

describe('ParticleField update', () => {
  it('moves particles by their velocity', () => {
    const f = new ParticleField(fixedRng())
    f.emit(ANCHOR, 0, 1.0)
    const before = f.particles.map((p) => ({ x: p.x, y: p.y }))
    f.update(0.1)
    f.particles.forEach((p, i) => {
      expect(p.x).toBeCloseTo(before[i].x + p.vx * 0.1, 5)
      expect(p.y).toBeCloseTo(before[i].y + p.vy * 0.1, 5)
    })
  })

  it('removes particles when their age exceeds their life', () => {
    const f = new ParticleField(fixedRng())
    f.emit(ANCHOR, 1, 1.0)
    expect(f.particles.length).toBeGreaterThan(0)
    f.update(10) // far beyond any lifetime
    expect(f.particles.length).toBe(0)
  })

  it('ages particles across multiple updates', () => {
    const f = new ParticleField(fixedRng())
    f.emit(ANCHOR, 0, 1.0)
    const life = f.particles[0].life
    let steps = 0
    while (f.particles.length > 0 && steps < 1000) {
      f.update(life / 10)
      steps++
    }
    expect(steps).toBeLessThanOrEqual(11)
  })
})
