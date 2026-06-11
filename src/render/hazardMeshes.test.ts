import { expect, test } from 'vitest'
import type { Hazard } from '../hazards/types'
import { HazardMeshes } from './hazardMeshes'

// Runs in node: HazardMeshes only builds three.js scene-graph objects, no GL.

const gapHalfOf = (hm: HazardMeshes, h: Hazard, mouth: number): number => {
  hm.update([h], mouth, 0)
  const group = hm.object.children[0]
  const [lower, upper] = group.children
  // Slabs are full cave height with centers slid apart; the half-gap is
  // (upper.center − lower.center) / 2 − CAVE_HEIGHT/2... recover via positions:
  return (upper.position.y - lower.position.y) / 2 - 5 // CAVE_HEIGHT/2 = 5
}

test('maw slabs open with the mouth', () => {
  const h: Hazard = { kind: 'maw', x: 10, gapCenter: 5, maxHalf: 1.6 }
  const hm = new HazardMeshes()
  expect(gapHalfOf(hm, h, 0)).toBeCloseTo(0)
  expect(gapHalfOf(hm, h, 1)).toBeCloseTo(1.6)
  expect(gapHalfOf(hm, h, 0.5)).toBeCloseTo(0.8)
})

test('clamp slabs close as the mouth opens (inverted)', () => {
  const h: Hazard = { kind: 'clamp', x: 10, gapCenter: 5, maxHalf: 1.6 }
  const hm = new HazardMeshes()
  expect(gapHalfOf(hm, h, 0)).toBeCloseTo(1.6)
  expect(gapHalfOf(hm, h, 1)).toBeCloseTo(0)
  expect(gapHalfOf(hm, h, 0.5)).toBeCloseTo(0.8)
})
