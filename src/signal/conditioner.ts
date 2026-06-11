import { FACE_DECAY_PER_S, FACE_HOLD_S } from '../config'

export interface ConditionedSignals {
  brow: number
  mouth: number
  faceLost: boolean
}

function moveToward(v: number, target: number, step: number): number {
  if (Math.abs(v - target) <= step) return target
  return v + Math.sign(target - v) * step
}

export class SignalConditioner {
  private brow = 0
  private mouth = 0
  private lostFor = 0

  constructor(
    private holdS: number = FACE_HOLD_S,
    private decayPerS: number = FACE_DECAY_PER_S,
  ) {}

  update(frame: { brow: number; mouth: number } | null, dt: number): ConditionedSignals {
    if (frame) {
      this.brow = frame.brow
      this.mouth = frame.mouth
      this.lostFor = 0
      return { brow: this.brow, mouth: this.mouth, faceLost: false }
    }
    const prevLost = this.lostFor
    this.lostFor += dt
    const decayTime = Math.min(dt, Math.max(0, this.lostFor - Math.max(this.holdS, prevLost)))
    if (decayTime > 0) {
      const step = this.decayPerS * decayTime
      this.brow = moveToward(this.brow, 0, step)
      this.mouth = moveToward(this.mouth, 0, step)
    }
    return { brow: this.brow, mouth: this.mouth, faceLost: true }
  }
}
