import { DEAD_ZONE, MAX_SLOPE, PEN_LEAD_S, SPEED_START, VIEW_AHEAD_S } from '../config'
import { anyCollision } from '../hazards/collision'
import { Spawner } from '../hazards/spawner'
import { applyDeadZone } from '../signal/deadzone'
import { SignalConditioner, type ConditionedSignals } from '../signal/conditioner'
import type { FaceFrame } from '../signal/types'
import { Track } from '../track/track'
import { speedAt } from './difficulty'

export type Phase = 'title' | 'calibrating' | 'running' | 'gameover'

export interface KVStore {
  get(key: string): string | null
  set(key: string, value: string): void
}

export function browserStore(): KVStore {
  return {
    get: (k) => globalThis.localStorage?.getItem(k) ?? null,
    set: (k, v) => globalThis.localStorage?.setItem(k, v),
  }
}

const HIGH_SCORE_KEY = 'brows.highScore'
const PRUNE_BEHIND = 30

export class Game {
  phase: Phase = 'title'
  distance = 0
  speed = SPEED_START
  track = new Track()
  spawner: Spawner
  signals: ConditionedSignals = { brow: 0, mouth: 0, faceLost: false }
  highScore: number
  private conditioner = new SignalConditioner()

  constructor(
    private store: KVStore = browserStore(),
    private rng: () => number = Math.random,
  ) {
    this.spawner = new Spawner(rng)
    const stored = Number(store.get(HIGH_SCORE_KEY) ?? 0)
    this.highScore = Number.isFinite(stored) ? stored : 0
  }

  get cartX(): number {
    return this.distance
  }

  get cartY(): number {
    return this.track.elevationAt(this.cartX)
  }

  get score(): number {
    return Math.floor(this.distance)
  }

  startRun(): void {
    this.phase = 'running'
    this.distance = 0
    this.speed = SPEED_START
    this.track = new Track()
    this.spawner = new Spawner(this.rng)
    this.conditioner = new SignalConditioner()
  }

  update(dt: number, frame: FaceFrame | null): void {
    this.signals = this.conditioner.update(frame, dt)
    if (this.phase !== 'running') return

    this.speed = speedAt(this.distance)
    this.distance += this.speed * dt

    const slope = applyDeadZone(this.signals.brow, DEAD_ZONE) * MAX_SLOPE
    this.track.advancePen(this.cartX + this.speed * PEN_LEAD_S, slope)
    this.spawner.fillTo(this.cartX + this.speed * VIEW_AHEAD_S, this.speed, this.distance)
    this.track.prune(this.cartX - PRUNE_BEHIND)
    this.spawner.prune(this.cartX - PRUNE_BEHIND)

    if (anyCollision(this.spawner.hazards, this.cartX, this.cartY, this.signals.mouth)) {
      this.phase = 'gameover'
      if (this.score > this.highScore) {
        this.highScore = this.score
        this.store.set(HIGH_SCORE_KEY, String(this.highScore))
      }
    }
  }
}
