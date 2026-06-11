import { expect, test } from 'vitest'
import { applyDeadZone } from './deadzone'

test('values inside the dead zone are exactly 0', () => {
  expect(applyDeadZone(0.1, 0.15)).toBe(0)
  expect(applyDeadZone(-0.15, 0.15)).toBe(0)
  expect(applyDeadZone(0, 0.15)).toBe(0)
})

test('full deflection is preserved', () => {
  expect(applyDeadZone(1, 0.15)).toBe(1)
  expect(applyDeadZone(-1, 0.15)).toBe(-1)
})

test('output rescales smoothly from the dead zone edge (no jump)', () => {
  expect(applyDeadZone(0.150001, 0.15)).toBeCloseTo(0, 4)
  expect(applyDeadZone(0.575, 0.15)).toBeCloseTo(0.5) // midpoint of live range
  expect(applyDeadZone(-0.575, 0.15)).toBeCloseTo(-0.5)
})
