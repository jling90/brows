import { describe, expect, it } from 'vitest'
import {
  ASSUMED_BROW_RANGE,
  ASSUMED_MOUTH_RANGE,
  provisionalBrow,
  provisionalMouth,
} from './calibrationHints'

// Provisional signals drive the onboarding hints DURING calibration, before
// real ranges exist: direction must always be right, magnitude approximate.

describe('provisionalBrow', () => {
  it('is zero at the captured neutral', () => {
    expect(provisionalBrow(0.2, 0.2)).toBe(0)
  })

  it('is positive when raised above neutral, negative when furrowed below', () => {
    expect(provisionalBrow(0.2 + ASSUMED_BROW_RANGE / 2, 0.2)).toBeCloseTo(0.5)
    expect(provisionalBrow(0.2 - ASSUMED_BROW_RANGE / 2, 0.2)).toBeCloseTo(-0.5)
  })

  it('saturates at ±1 for big swings', () => {
    expect(provisionalBrow(5, 0)).toBe(1)
    expect(provisionalBrow(-5, 0)).toBe(-1)
  })
})

describe('provisionalMouth', () => {
  it('is zero at the captured closed value and never negative', () => {
    expect(provisionalMouth(0.05, 0.05)).toBe(0)
    expect(provisionalMouth(0.0, 0.05)).toBe(0)
  })

  it('scales toward 1 over the assumed range and saturates', () => {
    expect(provisionalMouth(0.05 + ASSUMED_MOUTH_RANGE / 2, 0.05)).toBeCloseTo(0.5)
    expect(provisionalMouth(5, 0.05)).toBe(1)
  })
})
