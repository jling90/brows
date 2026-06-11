import { expect, test } from 'vitest'
import { anyCollision, cartBounds, hits } from './collision'
import type { Hazard } from './types'

// Cart at trackY=4: bounds y ∈ [4, 5], x ∈ [cartX−0.6, cartX+0.6]

test('cartBounds sits on the track and spans the cart box', () => {
  expect(cartBounds(10, 4)).toEqual({ minX: 9.4, maxX: 10.6, minY: 4, maxY: 5 })
})

test('no hit when horizontally clear of the hazard', () => {
  const h: Hazard = { kind: 'stalagmite', x: 20, height: 9 }
  expect(hits(h, cartBounds(10, 4), 0)).toBe(false)
})

test('stalagmite hits when cart bottom is below its tip', () => {
  const h: Hazard = { kind: 'stalagmite', x: 10, height: 4.5 }
  expect(hits(h, cartBounds(10, 4), 0)).toBe(true) // cart bottom 4 < 4.5
  expect(hits(h, cartBounds(10, 5), 0)).toBe(false) // cart bottom 5 > 4.5
})

test('stalactite hits when cart top is above its tip', () => {
  const h: Hazard = { kind: 'stalactite', x: 10, height: 4.5 } // tip at y = 10 − 4.5 = 5.5
  expect(hits(h, cartBounds(10, 5), 0)).toBe(true) // cart top 6 > 5.5
  expect(hits(h, cartBounds(10, 4), 0)).toBe(false) // cart top 5 < 5.5
})

test('wall passes only when the cart fits inside the fixed gap', () => {
  const h: Hazard = { kind: 'wall', x: 10, gapCenter: 5, gapHalf: 1.4 }
  expect(hits(h, cartBounds(10, 4.1), 0)).toBe(false) // cart y ∈ [4.1, 5.1] inside [3.6, 6.4]
  expect(hits(h, cartBounds(10, 6), 0)).toBe(true) // top 7 > 6.4
  expect(hits(h, cartBounds(10, 3), 0)).toBe(true) // bottom 3 < 3.6
})

test('maw aperture tracks the live Mouth Signal', () => {
  const h: Hazard = { kind: 'maw', x: 10, gapCenter: 4.5, maxHalf: 1.6 }
  // Cart y ∈ [4, 5]; needs aperture half ≥ 0.5 → mouth ≥ 0.3125
  expect(hits(h, cartBounds(10, 4), 1)).toBe(false) // wide open
  expect(hits(h, cartBounds(10, 4), 0)).toBe(true) // closed mouth = sealed
  expect(hits(h, cartBounds(10, 4), 0.2)).toBe(true) // half-open squeeze clips
  expect(hits(h, cartBounds(10, 4), 0.4)).toBe(false) // open enough
})

test('anyCollision scans all hazards', () => {
  const hazards: Hazard[] = [
    { kind: 'stalagmite', x: 50, height: 9 },
    { kind: 'wall', x: 10, gapCenter: 5, gapHalf: 1.4 },
  ]
  expect(anyCollision(hazards, 10, 4.1, 0)).toBe(false)
  expect(anyCollision(hazards, 10, 7, 0)).toBe(true)
})

test('clamp aperture is inverted: closed mouth passes, open mouth bites', () => {
  const h: Hazard = { kind: 'clamp', x: 10, gapCenter: 4.5, maxHalf: 1.6 }
  // Cart y ∈ [4, 5]; needs aperture half ≥ 0.5 → (1 − mouth) ≥ 0.3125 → mouth ≤ 0.6875
  expect(hits(h, cartBounds(10, 4), 0)).toBe(false) // mouth shut = wide open clamp
  expect(hits(h, cartBounds(10, 4), 1)).toBe(true) // mouth open = bitten
  expect(hits(h, cartBounds(10, 4), 0.8)).toBe(true) // mostly open still clips
  expect(hits(h, cartBounds(10, 4), 0.5)).toBe(false) // half open squeaks through
})
