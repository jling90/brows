import { expect, test } from 'vitest'
import { TRACK_MIN_Y, TRACK_MAX_Y, CAVE_HEIGHT } from './config'

test('track band sits inside the cave', () => {
  expect(TRACK_MIN_Y).toBeGreaterThanOrEqual(0)
  expect(TRACK_MAX_Y).toBeLessThanOrEqual(CAVE_HEIGHT)
})
