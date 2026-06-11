import { MAW_REST_S } from '../config'
import { spacingSecondsAt } from '../game/difficulty'
import type { Hazard } from './types'

export class Spawner {
  hazards: Hazard[] = []
  private nextX: number
  private lastMawX = -Infinity

  constructor(
    private rng: () => number = Math.random,
    firstX = 40,
  ) {
    this.nextX = firstX
  }

  /** Spawn hazards until the frontier reaches x. Spacing is seconds-at-current-speed. */
  fillTo(x: number, speed: number, distance: number): void {
    while (this.nextX < x) {
      this.hazards.push(this.make(this.nextX, speed))
      this.nextX += spacingSecondsAt(distance) * speed
    }
  }

  private make(x: number, speed: number): Hazard {
    const mawAllowed = x - this.lastMawX >= MAW_REST_S * speed
    const r = this.rng()
    if (mawAllowed && r < 0.2) {
      this.lastMawX = x
      return { kind: 'maw', x, gapCenter: this.range(3, 7), maxHalf: 1.6 }
    }
    if (r < 0.45) return { kind: 'stalagmite', x, height: this.range(2.5, 5.5) }
    if (r < 0.7) return { kind: 'stalactite', x, height: this.range(2.5, 5.5) }
    return { kind: 'wall', x, gapCenter: this.range(2.5, 7.5), gapHalf: 1.4 }
  }

  private range(a: number, b: number): number {
    return a + (b - a) * this.rng()
  }

  prune(minX: number): void {
    this.hazards = this.hazards.filter((h) => h.x > minX)
  }
}
