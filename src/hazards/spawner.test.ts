import { expect, test } from 'vitest'
import { Spawner } from './spawner'
import { MAW_REST_S } from '../config'

/** rng stub: returns queued values, then repeats the last one. */
function rngFrom(values: number[]): () => number {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

test('fillTo populates hazards up to x and not beyond', () => {
  const s = new Spawner(rngFrom([0.5]), 40)
  s.fillTo(100, 10, 0)
  expect(s.hazards.length).toBeGreaterThan(0)
  expect(s.hazards.every((h) => h.x <= 100)).toBe(true)
  const count = s.hazards.length
  s.fillTo(100, 10, 0) // idempotent
  expect(s.hazards.length).toBe(count)
})

test('spacing follows spacingSecondsAt(distance) × speed', () => {
  const s = new Spawner(rngFrom([0.5]), 40)
  s.fillTo(100, 10, 0) // spacing at distance 0 = 2.2s × 10 = 22 units
  expect(s.hazards[1].x - s.hazards[0].x).toBeCloseTo(22)
})

test('a low roll spawns a maw, and maws respect the rest beat', () => {
  const s = new Spawner(rngFrom([0.0]), 40) // every roll wants a maw
  s.fillTo(400, 10, 0)
  const maws = s.hazards.filter((h) => h.kind === 'maw')
  expect(maws.length).toBeGreaterThan(1)
  for (let i = 1; i < maws.length; i++) {
    expect(maws[i].x - maws[i - 1].x).toBeGreaterThanOrEqual(MAW_REST_S * 10)
  }
})

test('hazard params stay inside the cave band', () => {
  const s = new Spawner(rngFrom([0.99, 0.99, 0.0, 0.0, 0.5, 0.5]), 40)
  s.fillTo(300, 10, 0)
  for (const h of s.hazards) {
    if (h.kind === 'stalagmite' || h.kind === 'stalactite') {
      expect(h.height).toBeGreaterThan(0)
      expect(h.height).toBeLessThan(10)
    } else {
      expect(h.gapCenter).toBeGreaterThan(0)
      expect(h.gapCenter).toBeLessThan(10)
    }
  }
})

test('prune removes hazards behind minX', () => {
  const s = new Spawner(rngFrom([0.5]), 40)
  s.fillTo(200, 10, 0)
  s.prune(100)
  expect(s.hazards.every((h) => h.x > 100)).toBe(true)
})
