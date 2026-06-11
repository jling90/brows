export interface CalibrationData {
  browNeutral: number
  browRaised: number
  browFurrowed: number
  mouthClosed: number
  mouthOpen: number
}

const EPS = 1e-4

export function normalizeBrow(raw: number, c: CalibrationData): number {
  if (raw >= c.browNeutral) {
    const range = c.browRaised - c.browNeutral
    if (range < EPS) return 0
    return Math.min(1, (raw - c.browNeutral) / range)
  }
  const range = c.browNeutral - c.browFurrowed
  if (range < EPS) return 0
  return Math.max(-1, (raw - c.browNeutral) / range)
}

export function normalizeMouth(raw: number, c: CalibrationData): number {
  const range = c.mouthOpen - c.mouthClosed
  if (range < EPS) return 0
  return Math.min(1, Math.max(0, (raw - c.mouthClosed) / range))
}
