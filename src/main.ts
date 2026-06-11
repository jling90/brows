import { Game } from './game/game'
import { Hud } from './render/hud'
import { GameRenderer } from './render/scene'
import { CalibrationCancelled, runCalibration } from './screens/calibrationScreen'
import { createOverlays } from './screens/overlays'
import { KeyboardSource } from './signal/keyboardSource'
import { MediaPipeSource, type LoadPhase } from './signal/mediapipeSource'
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

const LOADING_COPY: Record<LoadPhase, string> = {
  camera: 'requesting camera…',
  tracker: 'loading face tracker…',
}

async function startCamera(): Promise<void> {
  const setStatus = overlays.showLoading()
  const mp = new MediaPipeSource()
  try {
    await mp.start((phase) => setStatus(LOADING_COPY[phase]))
    overlays.hide()
    game.phase = 'calibrating'
    mp.calibration = await runCalibration(ui, mp)
    source.stop()
    source = mp
    game.startRun()
  } catch (err) {
    overlays.hide()
    mp.stop() // release camera tracks
    if (!(err instanceof CalibrationCancelled)) {
      console.error(err)
      alert('Camera unavailable — falling back to keyboard. (↑ ↓ Space)')
    }
    await startKeyboard()
  }
}

function showTitle(): void {
  overlays.showTitle(startKeyboard, startCamera)
}

let last = performance.now()
function tick(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const frame = source.read()
  game.update(dt, frame)
  renderer.avatar.update(frame?.landmarks ?? null, game.signals.faceLost)
  if (wasRunning && game.phase === 'gameover') {
    overlays.showGameOver(
      game.score,
      game.highScore,
      () => {
        overlays.hide()
        game.startRun()
      },
      () => {
        showTitle()
      },
    )
  }
  wasRunning = game.phase === 'running'
  hud.update(game)
  renderer.render(game, dt)
  requestAnimationFrame(tick)
}

showTitle()
requestAnimationFrame(tick)
