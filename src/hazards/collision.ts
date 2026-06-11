import { CART_HALF_H, CART_HALF_W, CAVE_HEIGHT, HAZARD_HALF_W } from '../config'
import type { Hazard } from './types'

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** Cart box: rests on the track, 2×CART_HALF_W wide, 2×CART_HALF_H tall. */
export function cartBounds(cartX: number, trackY: number): Bounds {
  return {
    minX: cartX - CART_HALF_W,
    maxX: cartX + CART_HALF_W,
    minY: trackY,
    maxY: trackY + 2 * CART_HALF_H,
  }
}

export function hits(h: Hazard, b: Bounds, mouth: number): boolean {
  const cx = (b.minX + b.maxX) / 2
  if (Math.abs(h.x - cx) > CART_HALF_W + HAZARD_HALF_W) return false
  switch (h.kind) {
    case 'stalagmite':
      return b.minY < h.height
    case 'stalactite':
      return b.maxY > CAVE_HEIGHT - h.height
    case 'wall':
      return b.maxY > h.gapCenter + h.gapHalf || b.minY < h.gapCenter - h.gapHalf
    case 'maw': {
      const half = h.maxHalf * Math.min(1, Math.max(0, mouth))
      return b.maxY > h.gapCenter + half || b.minY < h.gapCenter - half
    }
    case 'clamp': {
      // Inverted Maw: an open mouth bites the gap shut.
      const half = h.maxHalf * Math.min(1, Math.max(0, 1 - mouth))
      return b.maxY > h.gapCenter + half || b.minY < h.gapCenter - half
    }
  }
}

export function anyCollision(hazards: Hazard[], cartX: number, trackY: number, mouth: number): boolean {
  const b = cartBounds(cartX, trackY)
  return hazards.some((h) => hits(h, b, mouth))
}
