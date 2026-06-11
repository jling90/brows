import { expect, test } from 'vitest'
import { clampShareAt, mawMaxHalfAt, rampAt, spacingSecondsAt, speedAt, spikeMaxHeightAt } from './difficulty'
import {
  CLAMP_SHARE_END, HAZARD_RAMP_M, MAW_MAX_HALF_END, MAW_MAX_HALF_START,
  SPACING_MIN_S, SPACING_START_S, SPEED_MAX, SPEED_START,
  SPIKE_MAX_H_END, SPIKE_MAX_H_START,
} from '../config'

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

test('hazard ramp runs 0→1 over HAZARD_RAMP_M and clamps', () => {
  expect(rampAt(0)).toBe(0)
  expect(rampAt(HAZARD_RAMP_M / 2)).toBeCloseTo(0.5)
  expect(rampAt(HAZARD_RAMP_M)).toBe(1)
  expect(rampAt(1e6)).toBe(1)
  expect(rampAt(-5)).toBe(0)
})

test('spike max height grows from start to end over the ramp', () => {
  expect(spikeMaxHeightAt(0)).toBe(SPIKE_MAX_H_START)
  expect(spikeMaxHeightAt(1e6)).toBe(SPIKE_MAX_H_END)
  expect(spikeMaxHeightAt(HAZARD_RAMP_M / 2)).toBeCloseTo((SPIKE_MAX_H_START + SPIKE_MAX_H_END) / 2)
})

test('maw maxHalf shrinks from forgiving to tight over the ramp', () => {
  expect(mawMaxHalfAt(0)).toBe(MAW_MAX_HALF_START)
  expect(mawMaxHalfAt(1e6)).toBe(MAW_MAX_HALF_END)
  expect(mawMaxHalfAt(0)).toBeGreaterThan(mawMaxHalfAt(300))
})

test('clamp share starts at zero (early game teaches open=good) and ramps to CLAMP_SHARE_END', () => {
  expect(clampShareAt(0)).toBe(0)
  expect(clampShareAt(1e6)).toBe(CLAMP_SHARE_END)
})
