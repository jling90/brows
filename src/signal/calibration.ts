export interface CalibrationData {
  browNeutral: number
  browRaised: number
  browFurrowed: number
  mouthClosed: number
  mouthOpen: number
}

const EPS = 1e-4

export function normalizeBrow(raw: number, c: CalibrationData): number {
  if (!Number.isFinite(raw)) return 0
  if (raw >= c.browNeutral) {
    const range = c.browRaised - c.browNeutral
    // also catches inverted ranges (negative) from a bad calibration — treated as degenerate
    if (range < EPS) return 0
    return Math.min(1, (raw - c.browNeutral) / range)
  }
  const range = c.browNeutral - c.browFurrowed
  // also catches inverted ranges (negative) from a bad calibration — treated as degenerate
  if (range < EPS) return 0
  return Math.max(-1, (raw - c.browNeutral) / range)
}

export function normalizeMouth(raw: number, c: CalibrationData): number {
  if (!Number.isFinite(raw)) return 0
  const range = c.mouthOpen - c.mouthClosed
  // also catches inverted ranges (negative) from a bad calibration — treated as degenerate
  if (range < EPS) return 0
  return Math.min(1, Math.max(0, (raw - c.mouthClosed) / range))
}
