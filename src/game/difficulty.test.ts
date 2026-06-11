import { expect, test } from 'vitest'
import { spacingSecondsAt, speedAt } from './difficulty'
import { SPACING_MIN_S, SPACING_START_S, SPEED_MAX, SPEED_START } from '../config'

test('speed starts at SPEED_START and rises with distance', () => {
  expect(speedAt(0)).toBe(SPEED_START)
  expect(speedAt(100)).toBeGreaterThan(speedAt(50))
})

test('speed caps at SPEED_MAX', () => {
  expect(speedAt(1e6)).toBe(SPEED_MAX)
})

test('hazard spacing starts at SPACING_START_S and shrinks with distance', () => {
  expect(spacingSecondsAt(0)).toBe(SPACING_START_S)
  expect(spacingSecondsAt(200)).toBeLessThan(spacingSecondsAt(100))
})

test('spacing floors at SPACING_MIN_S', () => {
  expect(spacingSecondsAt(1e6)).toBe(SPACING_MIN_S)
})

test('mid-curve exact values', () => {
  expect(speedAt(50)).toBeCloseTo(10.5) // 8 + 0.05×50
  expect(spacingSecondsAt(50)).toBeCloseTo(2.0) // 2.2 − 0.004×50
})
