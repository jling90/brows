import {
  CLAMP_SHARE_END, HAZARD_RAMP_M, MAW_MAX_HALF_END, MAW_MAX_HALF_START,
  SPACING_MIN_S, SPACING_PER_M, SPACING_START_S,
  SPEED_MAX, SPEED_PER_M, SPEED_START,
  SPIKE_MAX_H_END, SPIKE_MAX_H_START,
} from '../config'

export function speedAt(distance: number): number {
  return Math.min(SPEED_MAX, SPEED_START + SPEED_PER_M * distance)
}

/** Hazard spacing in seconds-at-current-speed, so reaction windows shrink predictably. */
export function spacingSecondsAt(distance: number): number {
  return Math.max(SPACING_MIN_S, SPACING_START_S - SPACING_PER_M * distance)
}

/** Hazard difficulty ramp: 0 at the start, 1 once HAZARD_RAMP_M is reached. */
export function rampAt(distance: number): number {
  return Math.min(1, Math.max(0, distance / HAZARD_RAMP_M))
}

/** Upper bound for stalagmite/stalactite heights, growing over the ramp. */
export function spikeMaxHeightAt(distance: number): number {
  return SPIKE_MAX_H_START + (SPIKE_MAX_H_END - SPIKE_MAX_H_START) * rampAt(distance)
}

/** Maw/Clamp maxHalf: forgiving early, shrinking to the tight late-game aperture. */
export function mawMaxHalfAt(distance: number): number {
  return MAW_MAX_HALF_START + (MAW_MAX_HALF_END - MAW_MAX_HALF_START) * rampAt(distance)
}

/** Probability that a mouth hazard spawns as a Clamp instead of a Maw. Zero early: the opening stretch teaches that open = good before inverting it. */
export function clampShareAt(distance: number): number {
  return CLAMP_SHARE_END * rampAt(distance)
}
