import {
  SPACING_MIN_S, SPACING_PER_M, SPACING_START_S,
  SPEED_MAX, SPEED_PER_M, SPEED_START,
} from '../config'

export function speedAt(distance: number): number {
  return Math.min(SPEED_MAX, SPEED_START + SPEED_PER_M * distance)
}

/** Hazard spacing in seconds-at-current-speed, so reaction windows shrink predictably. */
export function spacingSecondsAt(distance: number): number {
  return Math.max(SPACING_MIN_S, SPACING_START_S - SPACING_PER_M * distance)
}
