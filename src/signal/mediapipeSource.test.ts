import { expect, test } from 'vitest'
import { rawBrowFromBlendshapes, rawMouthFromBlendshapes } from './mediapipeSource'

const shapes = (m: Record<string, number>) =>
  Object.entries(m).map(([categoryName, score]) => ({ categoryName, score }))

test('brow scalar = inner-up minus mean brow-down', () => {
  expect(
    rawBrowFromBlendshapes(shapes({ browInnerUp: 0.8, browDownLeft: 0.1, browDownRight: 0.3 })),
  ).toBeCloseTo(0.8 - 0.2)
})

test('missing categories default to 0', () => {
  expect(rawBrowFromBlendshapes(shapes({}))).toBe(0)
  expect(rawMouthFromBlendshapes(shapes({}))).toBe(0)
})

test('mouth scalar = jawOpen', () => {
  expect(rawMouthFromBlendshapes(shapes({ jawOpen: 0.55 }))).toBe(0.55)
})
