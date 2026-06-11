import { expect, test } from 'vitest'
import { Track } from './track'
import { DX, TRACK_MAX_Y, TRACK_MIN_Y } from '../config'

test('starts at mid-cave with the Pen at x=0', () => {
  const t = new Track()
  expect(t.penX).toBe(0)
  expect(t.penY).toBe(5)
})

test('advancing with zero slope lays level track', () => {
  const t = new Track()
  t.advancePen(10, 0)
  expect(t.penX).toBeGreaterThanOrEqual(10 - DX)
  expect(t.elevationAt(7.3)).toBe(5)
})

test('positive slope climbs at dy/dx', () => {
  const t = new Track()
  t.advancePen(4, 0.5)
  expect(t.elevationAt(4)).toBeCloseTo(5 + 0.5 * 4, 1)
})

test('elevation clamps at the cave band and stays there', () => {
  const t = new Track()
  t.advancePen(100, 0.9)
  expect(t.penY).toBe(TRACK_MAX_Y)
  const t2 = new Track()
  t2.advancePen(100, -0.9)
  expect(t2.penY).toBe(TRACK_MIN_Y)
})

test('elevationAt interpolates between samples', () => {
  const t = new Track()
  t.advancePen(2, 0.8)
  const mid = (t.elevationAt(0) + t.elevationAt(2 * DX)) / 2
  expect(t.elevationAt(DX)).toBeCloseTo(mid)
})

test('committed track does not change when later slope changes', () => {
  const t = new Track()
  t.advancePen(5, 0.5)
  const yAt3 = t.elevationAt(3)
  t.advancePen(10, -0.9)
  expect(t.elevationAt(3)).toBe(yAt3)
})

test('prune drops samples behind minX but keeps elevation queries working', () => {
  const t = new Track()
  t.advancePen(20, 0.2)
  const yAt15 = t.elevationAt(15)
  t.prune(10)
  expect(t.elevationAt(15)).toBeCloseTo(yAt15)
  expect(t.points(0, 20)[0].x).toBeGreaterThanOrEqual(10 - DX)
})

test('points returns {x,y} samples within a window', () => {
  const t = new Track()
  t.advancePen(10, 0)
  const pts = t.points(2, 4)
  expect(pts.length).toBeGreaterThan(0)
  expect(pts.every((p) => p.x >= 2 && p.x <= 4 && p.y === 5)).toBe(true)
})
