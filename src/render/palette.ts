export type RGB = [number, number, number]

export const MAGENTA: RGB = [1.0, 0.17, 0.84]
export const ORANGE: RGB = [1.0, 0.62, 0.24]
export const CYAN: RGB = [0.15, 0.91, 1.0]

const STOPS: [number, RGB][] = [
  [0, MAGENTA],
  [0.5, ORANGE],
  [1, CYAN],
]

/** Sunset gradient magenta→orange→cyan. Hue is aesthetic only (ADR 0003). */
export function gradientColor(t: number): RGB {
  const x = Math.min(1, Math.max(0, t))
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, c0] = STOPS[i]
    const [t1, c1] = STOPS[i + 1]
    if (x <= t1) {
      if (x === t0) return c0
      if (x === t1) return c1
      const f = (x - t0) / (t1 - t0)
      return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f]
    }
  }
  return CYAN
}
