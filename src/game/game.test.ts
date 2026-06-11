import { expect, test } from 'vitest'
import { Game, type KVStore } from './game'
import { PEN_LEAD_S, SPEED_START } from '../config'

function memStore(initial: Record<string, string> = {}): KVStore {
  const m = new Map(Object.entries(initial))
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v) }
}

const neutral = { brow: 0, mouth: 0, landmarks: null }
const raise = { brow: 1, mouth: 0, landmarks: null }

test('starts on title and ignores updates until a run starts', () => {
  const g = new Game(memStore())
  expect(g.phase).toBe('title')
  g.update(0.016, neutral)
  expect(g.distance).toBe(0)
})

test('startRun resets state and begins moving', () => {
  const g = new Game(memStore())
  g.startRun()
  expect(g.phase).toBe('running')
  g.update(0.1, neutral)
  expect(g.distance).toBeCloseTo(SPEED_START * 0.1)
})

test('the Pen stays ~PEN_LEAD_S ahead of the Cart', () => {
  const g = new Game(memStore())
  g.startRun()
  for (let i = 0; i < 60; i++) g.update(1 / 60, neutral)
  expect(g.track.penX).toBeGreaterThanOrEqual(g.cartX + g.speed * PEN_LEAD_S - 0.5)
})

test('raised brows make the track climb ahead of the cart', () => {
  const g = new Game(memStore())
  g.startRun()
  for (let i = 0; i < 60; i++) g.update(1 / 60, raise)
  expect(g.track.penY).toBeGreaterThan(5)
})

test('collision ends the run and saves a new high score', () => {
  const store = memStore()
  const g = new Game(store, () => 0.99) // rng → all stalactites, near max height
  g.startRun()
  // Hold a full climb: the cart pins at the ceiling and must hit a stalactite.
  for (let i = 0; i < 60 * 120 && g.phase === 'running'; i++) g.update(1 / 60, raise)
  expect(g.phase).toBe('gameover')
  expect(g.highScore).toBeGreaterThan(0)
  expect(Number(store.get('brows.highScore'))).toBe(g.highScore)
})

test('high score is not lowered by a worse run', () => {
  const store = memStore({ 'brows.highScore': '999999' })
  const g = new Game(store, () => 0.99)
  g.startRun()
  for (let i = 0; i < 60 * 120 && g.phase === 'running'; i++) g.update(1 / 60, raise)
  expect(g.highScore).toBe(999999)
})

test('startRun after gameover starts a fresh run', () => {
  const g = new Game(memStore(), () => 0.99)
  g.startRun()
  for (let i = 0; i < 60 * 120 && g.phase === 'running'; i++) g.update(1 / 60, raise)
  g.startRun()
  expect(g.phase).toBe('running')
  expect(g.distance).toBe(0)
  expect(g.track.penY).toBe(5)
})

test('corrupt stored high score falls back to 0', () => {
  const g = new Game(memStore({ 'brows.highScore': 'garbage' }))
  expect(g.highScore).toBe(0)
})
