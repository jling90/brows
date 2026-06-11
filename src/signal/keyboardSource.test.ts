import { expect, test } from 'vitest'
import { keysToFrame } from './keyboardSource'

test('no keys = neutral frame', () => {
  expect(keysToFrame({ up: false, down: false, space: false }))
    .toEqual({ brow: 0, mouth: 0, landmarks: null })
})

test('up = full raise, down = full furrow, both cancel', () => {
  expect(keysToFrame({ up: true, down: false, space: false }).brow).toBe(1)
  expect(keysToFrame({ up: false, down: true, space: false }).brow).toBe(-1)
  expect(keysToFrame({ up: true, down: true, space: false }).brow).toBe(0)
})

test('space = mouth fully open', () => {
  expect(keysToFrame({ up: false, down: false, space: true }).mouth).toBe(1)
})
