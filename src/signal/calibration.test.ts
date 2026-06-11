import { describe, expect, test } from 'vitest'
import { normalizeBrow, normalizeMouth, type CalibrationData } from './calibration'

const c: CalibrationData = {
  browNeutral: 0.3, browRaised: 0.8, browFurrowed: 0.1,
  mouthClosed: 0.05, mouthOpen: 0.65,
}

describe('normalizeBrow', () => {
  test('neutral maps to 0', () => expect(normalizeBrow(0.3, c)).toBe(0))
  test('calibrated raise maps to 1', () => expect(normalizeBrow(0.8, c)).toBe(1))
  test('calibrated furrow maps to -1', () => expect(normalizeBrow(0.1, c)).toBe(-1))
  test('half raise maps to 0.5', () => expect(normalizeBrow(0.55, c)).toBeCloseTo(0.5))
  test('beyond calibrated raise clamps to 1', () => expect(normalizeBrow(0.95, c)).toBe(1))
  test('beyond calibrated furrow clamps to -1', () => expect(normalizeBrow(0.0, c)).toBe(-1))
  test('degenerate range yields 0, not NaN', () => {
    const flat = { ...c, browRaised: 0.3 }
    expect(normalizeBrow(0.5, flat)).toBe(0)
  })
  test('non-finite raw yields 0, not NaN', () => {
    expect(normalizeBrow(NaN, c)).toBe(0)
    expect(normalizeBrow(Infinity, c)).toBe(0)
    expect(normalizeBrow(-Infinity, c)).toBe(0)
  })
})

describe('normalizeMouth', () => {
  test('closed maps to 0', () => expect(normalizeMouth(0.05, c)).toBe(0))
  test('calibrated open maps to 1', () => expect(normalizeMouth(0.65, c)).toBe(1))
  test('halfway maps to 0.5', () => expect(normalizeMouth(0.35, c)).toBeCloseTo(0.5))
  test('clamps below 0 and above 1', () => {
    expect(normalizeMouth(0.0, c)).toBe(0)
    expect(normalizeMouth(0.9, c)).toBe(1)
  })
  test('degenerate range yields 0, not NaN', () => {
    const flat = { ...c, mouthOpen: 0.05 }
    expect(normalizeMouth(0.5, flat)).toBe(0)
  })
  test('non-finite raw yields 0, not NaN', () => {
    expect(normalizeMouth(NaN, c)).toBe(0)
    expect(normalizeMouth(Infinity, c)).toBe(0)
    expect(normalizeMouth(-Infinity, c)).toBe(0)
  })
})
