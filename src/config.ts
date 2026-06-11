// World geometry
export const CAVE_HEIGHT = 10
export const TRACK_MIN_Y = 1
export const TRACK_MAX_Y = 9
export const DX = 0.25 // track sample spacing (world units)

// Control
export const MAX_SLOPE = 0.9 // dy/dx at |brow| = 1
export const PEN_LEAD_S = 1.0 // Pen leads the Cart by this many seconds
export const DEAD_ZONE = 0.15
export const FACE_HOLD_S = 0.5 // hold last signals on face loss
export const FACE_DECAY_PER_S = 2.0 // then decay toward neutral at this rate

// Cart
export const CART_HALF_W = 0.6
export const CART_HALF_H = 0.5

// Hazards
export const HAZARD_HALF_W = 0.5
export const MAW_REST_S = 6 // min seconds between Maws
export const VIEW_AHEAD_S = 3 // hazards exist this far ahead of the Cart

// Difficulty
// Speed and spacing curves are tuned to saturate together (~320m); keep them in sync when retuning.
export const SPEED_START = 8
export const SPEED_PER_M = 0.05
export const SPEED_MAX = 24
export const SPACING_START_S = 2.2
export const SPACING_MIN_S = 1.1 // must stay ≥ PEN_LEAD_S so reaction windows never undercut track commitment
export const SPACING_PER_M = 0.004

// Hazard difficulty ramp (saturates alongside the speed curve: (SPEED_MAX−SPEED_START)/SPEED_PER_M = 320m)
export const HAZARD_RAMP_M = 320
export const SPIKE_MIN_H = 2.5
export const SPIKE_MAX_H_START = 4.5 // gentle: leaves a 5.5 corridor
export const SPIKE_MAX_H_END = 8.0 // spicy: forces threading within ~2 of the far surface
export const MAW_MAX_HALF_START = 2.4 // a half-open mouth clears the Cart comfortably
export const MAW_MAX_HALF_END = 1.6 // launch-day difficulty becomes the late game
export const CLAMP_SHARE_END = 0.5 // share of mouth hazards that are Clamps at full ramp
