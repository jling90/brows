import { expect, test } from 'vitest'
import { gradientColor, MAGENTA, ORANGE, CYAN } from './palette'

test('endpoints and midpoint hit the palette stops', () => {
  expect(gradientColor(0)).toEqual(MAGENTA)
  expect(gradientColor(0.5)).toEqual(ORANGE)
  expect(gradientColor(1)).toEqual(CYAN)
})

test('t clamps outside [0,1]', () => {
  expect(gradientColor(-1)).toEqual(MAGENTA)
  expect(gradientColor(2)).toEqual(CYAN)
})

test('interpolates linearly between stops', () => {
  const c = gradientColor(0.25)
  for (let i = 0; i < 3; i++) {
    expect(c[i]).toBeCloseTo((MAGENTA[i] + ORANGE[i]) / 2)
  }
})
