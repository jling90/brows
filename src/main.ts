import { Game } from './game/game'
import { Hud } from './render/hud'
import { GameRenderer } from './render/scene'
import { KeyboardSource } from './signal/keyboardSource'
import type { FaceSignalSource } from './signal/types'

const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const game = new Game()
const renderer = new GameRenderer(canvas)
const hud = new Hud(document.querySelector<HTMLElement>('#ui')!)
const source: FaceSignalSource = new KeyboardSource()
await source.start()

// Temporary controls until Task 14 overlays: Enter starts/restarts.
addEventListener('keydown', (e) => {
  if (e.code === 'Enter' && game.phase !== 'running') game.startRun()
})

let last = performance.now()
function tick(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  game.update(dt, source.read())
  hud.update(game)
  renderer.render(game, dt)
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
