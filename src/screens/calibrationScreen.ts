import type { CalibrationData } from '../signal/calibration'
import type { MediaPipeSource } from '../signal/mediapipeSource'

interface Step {
  prompt: string
  collect: (mean: { brow: number; mouth: number }, c: Partial<CalibrationData>) => void
}

const STEPS: Step[] = [
  { prompt: '😐 Relax your face', collect: (m, c) => { c.browNeutral = m.brow; c.mouthClosed = m.mouth } },
  { prompt: '😮‍💨 Raise your eyebrows high', collect: (m, c) => { c.browRaised = m.brow } },
  { prompt: '😠 Furrow your brows', collect: (m, c) => { c.browFurrowed = m.brow } },
  { prompt: '😱 Open your mouth wide', collect: (m, c) => { c.mouthOpen = m.mouth } },
]

const SETTLE_MS = 1200
const SAMPLE_MS = 1500

/** Thrown when the player cancels calibration (Escape or the cancel button). */
export class CalibrationCancelled extends Error {
  constructor() { super('calibration cancelled') }
}

/** Runs the 4-step Calibration (relax/raise/furrow/open wide). Resolves with the player's ranges. */
export function runCalibration(ui: HTMLElement, source: MediaPipeSource): Promise<CalibrationData> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('div')
    el.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(5,1,10,0.92);color:#fff;text-align:center">
      <div id="cal-video-box" style="border:1px solid #27e7ff;border-radius:8px;overflow:hidden;box-shadow:0 0 16px #27e7ff55;transform:scaleX(-1)"></div>
      <div id="cal-prompt" style="font-size:26px"></div>
      <div id="cal-hint" style="font-size:14px;color:#f6c;min-height:18px"></div>
      <div id="cal-progress" style="width:240px;height:6px;background:#222;border-radius:3px">
        <div id="cal-bar" style="height:100%;width:0%;background:#ff2bd6;border-radius:3px"></div>
      </div>
      <button id="cal-cancel" style="font:inherit;font-size:14px;padding:6px 16px;background:none;color:#888;border:1px solid #555;border-radius:6px;cursor:pointer">✕ Cancel — use keyboard instead</button>
    </div>`
    ui.appendChild(el)
    const videoBox = el.querySelector<HTMLElement>('#cal-video-box')!
    source.video.width = 320
    source.video.height = 240
    videoBox.appendChild(source.video) // raw video is allowed here only (Calibration)
    const promptEl = el.querySelector<HTMLElement>('#cal-prompt')!
    const hintEl = el.querySelector<HTMLElement>('#cal-hint')!
    const barEl = el.querySelector<HTMLElement>('#cal-bar')!
    const cancelBtn = el.querySelector<HTMLElement>('#cal-cancel')!

    const partial: Partial<CalibrationData> = {}
    let stepIndex = 0
    let phaseStart = performance.now()
    let sampling = false
    let sum = { brow: 0, mouth: 0 }
    let n = 0
    let cancelled = false

    function onKeydown(e: KeyboardEvent): void {
      if (e.key === 'Escape') cancel()
    }

    function cancel(): void {
      cancelled = true
      el.remove()
      window.removeEventListener('keydown', onKeydown)
      reject(new CalibrationCancelled())
    }

    cancelBtn.addEventListener('click', cancel)
    window.addEventListener('keydown', onKeydown)

    function tick(now: number): void {
      if (cancelled) return
      const step = STEPS[stepIndex]
      promptEl.textContent = step.prompt
      const elapsed = now - phaseStart
      const raw = source.readRaw()
      if (!sampling) {
        barEl.style.width = '0%'
        if (elapsed >= SETTLE_MS) {
          sampling = true
          phaseStart = now
          sum = { brow: 0, mouth: 0 }
          n = 0
        }
      } else {
        if (raw) {
          sum.brow += raw.brow
          sum.mouth += raw.mouth
          n++
          hintEl.textContent = ''
        } else {
          hintEl.textContent = 'No face detected — check your lighting and framing'
        }
        barEl.style.width = `${Math.min(100, (elapsed / SAMPLE_MS) * 100)}%`
        if (elapsed >= SAMPLE_MS && n > 0) {
          step.collect({ brow: sum.brow / n, mouth: sum.mouth / n }, partial)
          stepIndex++
          sampling = false
          phaseStart = now
          if (stepIndex >= STEPS.length) {
            el.remove()
            window.removeEventListener('keydown', onKeydown)
            resolve(partial as CalibrationData)
            return
          }
        }
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}
