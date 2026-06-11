import { Game } from './game/game'
import { Hud } from './render/hud'
import { GameRenderer } from './render/scene'
import { createOverlays } from './screens/overlays'
import { KeyboardSource } from './signal/keyboardSource'
import type { FaceSignalSource } from './signal/types'

const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const ui = document.querySelector<HTMLElement>('#ui')!

const game = new Game()
const renderer = new GameRenderer(canvas)
const hud = new Hud(ui)
const overlays = createOverlays(ui)

let source: FaceSignalSource = new KeyboardSource()
let wasRunning = false

async function startKeyboard(): Promise<void> {
  source.stop()
  source = new KeyboardSource()
  await source.start()
  overlays.hide()
  game.startRun()
}

async function startCamera(): Promise<void> {
  // Replaced with the MediaPipe + calibration flow in Tasks 15–16.
  alert('Camera mode lands in a later task — keyboard for now!')
}

function showTitle(): void {
  overlays.showTitle(startKeyboard, startCamera)
}

let last = performance.now()
function tick(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  game.update(dt, source.read())
  if (wasRunning && game.phase === 'gameover') {
    overlays.showGameOver(game.score, game.highScore, () => {
      overlays.hide()
      game.startRun()
    })
  }
  wasRunning = game.phase === 'running'
  hud.update(game)
  renderer.render(game, dt)
  requestAnimationFrame(tick)
}

showTitle()
requestAnimationFrame(tick)
