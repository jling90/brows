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
export const SPEED_START = 8
export const SPEED_PER_M = 0.05
export const SPEED_MAX = 24
export const SPACING_START_S = 2.2
export const SPACING_MIN_S = 0.9
export const SPACING_PER_M = 0.004
