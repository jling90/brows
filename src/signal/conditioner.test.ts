import { expect, test } from 'vitest'
import { SignalConditioner } from './conditioner'

const frame = (brow: number, mouth: number) => ({ brow, mouth })

test('passes signals through when a face is present', () => {
  const c = new SignalConditioner()
  expect(c.update(frame(0.8, 0.4), 0.016)).toEqual({ brow: 0.8, mouth: 0.4, faceLost: false })
})

test('holds last signals during a brief dropout (<0.5s)', () => {
  const c = new SignalConditioner()
  c.update(frame(0.8, 1), 0.016)
  const out = c.update(null, 0.3) // 0.3s dropout
  expect(out).toEqual({ brow: 0.8, mouth: 1, faceLost: true })
})

test('decays toward neutral after the hold window', () => {
  const c = new SignalConditioner()
  c.update(frame(1, 1), 0.016)
  c.update(null, 0.5) // exhaust hold window
  const out = c.update(null, 0.25) // 0.25s of decay at 2.0/s = 0.5 movement
  expect(out.brow).toBeCloseTo(0.5)
  expect(out.mouth).toBeCloseTo(0.5)
  expect(out.faceLost).toBe(true)
})

test('decay settles at exactly 0 and does not overshoot', () => {
  const c = new SignalConditioner()
  c.update(frame(-0.4, 0.2), 0.016)
  c.update(null, 0.5)
  const out = c.update(null, 10)
  expect(out.brow).toBe(0)
  expect(out.mouth).toBe(0)
})

test('recovering the face snaps back to live values and resets the hold timer', () => {
  const c = new SignalConditioner()
  c.update(frame(1, 1), 0.016)
  c.update(null, 2)
  expect(c.update(frame(0.3, 0.6), 0.016)).toEqual({ brow: 0.3, mouth: 0.6, faceLost: false })
  expect(c.update(null, 0.3).brow).toBe(0.3) // hold window is fresh again
})
