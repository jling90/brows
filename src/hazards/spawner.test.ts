import { expect, test } from 'vitest'
import { Spawner } from './spawner'
import { MAW_REST_S } from '../config'
import { mawMaxHalfAt, spikeMaxHeightAt } from '../game/difficulty'

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

test('no clamps spawn at distance 0', () => {
  const s = new Spawner(rngFrom([0.0]), 40)
  s.fillTo(400, 10, 0)
  expect(s.hazards.some((h) => h.kind === 'clamp')).toBe(false)
  expect(s.hazards.some((h) => h.kind === 'maw')).toBe(true)
})

test('clamps appear among mouth hazards late game and share the rest beat', () => {
  // kind roll 0.0 → mouth hazard; clamp roll 0.3 < clampShareAt(1000)=0.5 → clamp
  const s = new Spawner(rngFrom([0.0, 0.3]), 40)
  s.fillTo(400, 10, 1000)
  const mouthHazards = s.hazards.filter((h) => h.kind === 'clamp' || h.kind === 'maw')
  expect(s.hazards.some((h) => h.kind === 'clamp')).toBe(true)
  for (let i = 1; i < mouthHazards.length; i++) {
    expect(mouthHazards[i].x - mouthHazards[i - 1].x).toBeGreaterThanOrEqual(MAW_REST_S * 10)
  }
})

test('spike heights respect the distance-scaled ceiling', () => {
  const early = new Spawner(rngFrom([0.3, 0.999]), 40) // stalagmite, max-height roll
  early.fillTo(400, 10, 0)
  for (const h of early.hazards) {
    if (h.kind === 'stalagmite' || h.kind === 'stalactite') {
      expect(h.height).toBeLessThanOrEqual(spikeMaxHeightAt(0))
    }
  }
  const late = new Spawner(rngFrom([0.3, 0.999]), 40)
  late.fillTo(400, 10, 1000)
  const lateSpikes = late.hazards.filter((h) => h.kind === 'stalagmite' || h.kind === 'stalactite')
  expect(lateSpikes.some((h) => (h as { height: number }).height > spikeMaxHeightAt(0))).toBe(true)
})

test('maw maxHalf is forgiving early and tight late', () => {
  const early = new Spawner(rngFrom([0.0, 0.99]), 40) // mouth hazard, clamp roll misses
  early.fillTo(400, 10, 0)
  const late = new Spawner(rngFrom([0.0, 0.99]), 40)
  late.fillTo(400, 10, 1000)
  const earlyMaw = early.hazards.find((h) => h.kind === 'maw')
  const lateMaw = late.hazards.find((h) => h.kind === 'maw')
  expect(earlyMaw && earlyMaw.kind === 'maw' && earlyMaw.maxHalf).toBe(mawMaxHalfAt(0))
  expect(lateMaw && lateMaw.kind === 'maw' && lateMaw.maxHalf).toBe(mawMaxHalfAt(1000))
})
