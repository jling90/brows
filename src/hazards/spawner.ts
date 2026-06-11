import { MAW_REST_S, SPIKE_MIN_H } from '../config'
import { clampShareAt, mawMaxHalfAt, spacingSecondsAt, spikeMaxHeightAt } from '../game/difficulty'
import type { Hazard } from './types'

export class Spawner {
  hazards: Hazard[] = []
  private nextX: number
  private lastMouthHazardX = -Infinity // Maws AND Clamps share the jaw-rest beat

  constructor(
    private rng: () => number = Math.random,
    firstX = 40,
  ) {
    this.nextX = firstX
  }

  /** Spawn hazards until the frontier reaches x. Spacing is seconds-at-current-speed. */
  fillTo(x: number, speed: number, distance: number): void {
    while (this.nextX < x) {
      this.hazards.push(this.make(this.nextX, speed, distance))
      this.nextX += spacingSecondsAt(distance) * speed
    }
  }

  private make(x: number, speed: number, distance: number): Hazard {
    const mouthAllowed = x - this.lastMouthHazardX >= MAW_REST_S * speed
    const r = this.rng()
    if (mouthAllowed && r < 0.2) {
      this.lastMouthHazardX = x
      const maxHalf = mawMaxHalfAt(distance)
      const kind = this.rng() < clampShareAt(distance) ? 'clamp' : 'maw'
      return { kind, x, gapCenter: this.range(3, 7), maxHalf }
    }
    const spikeMax = spikeMaxHeightAt(distance)
    if (r < 0.45) return { kind: 'stalagmite', x, height: this.range(SPIKE_MIN_H, spikeMax) }
    if (r < 0.7) return { kind: 'stalactite', x, height: this.range(SPIKE_MIN_H, spikeMax) }
    return { kind: 'wall', x, gapCenter: this.range(2.5, 7.5), gapHalf: 1.4 }
  }

  private range(a: number, b: number): number {
    return a + (b - a) * this.rng()
  }

  prune(minX: number): void {
    this.hazards = this.hazards.filter((h) => h.x > minX)
  }
}
