import type { CalibrationData } from '../signal/calibration'
import type { MediaPipeSource, RawReading } from '../signal/mediapipeSource'
import { anchorsFrom, BROW_INDICES, LIP_INDICES, ParticleField } from './calibrationParticles'

interface Step {
  prompt: string
  collect: (mean: { brow: number; mouth: number }, c: Partial<CalibrationData>) => void
  /** Particle sparks for this step: which landmarks to dress, and how hard, from the raw signal. */
  fx?: { indices: number[]; intensity: (r: RawReading) => number }
}

const STEPS: Step[] = [
  // Relax is the neutral baseline — deliberately no fx, keep it calm (issue #3).
  { prompt: '😐 Relax your face', collect: (m, c) => { c.browNeutral = m.brow; c.mouthClosed = m.mouth } },
  { prompt: '😮‍💨 Raise your eyebrows high', collect: (m, c) => { c.browRaised = m.brow },
    fx: { indices: BROW_INDICES, intensity: (r) => Math.max(0, r.brow) } },
  { prompt: '😠 Furrow your brows', collect: (m, c) => { c.browFurrowed = m.brow },
    fx: { indices: BROW_INDICES, intensity: (r) => Math.max(0, -r.brow) } },
  { prompt: '😱 Open your mouth wide', collect: (m, c) => { c.mouthOpen = m.mouth },
    fx: { indices: LIP_INDICES, intensity: (r) => r.mouth } },
]

/** Synthwave palette for sparks (ADR 0003): magenta / orange / cyan. */
const FX_COLORS = ['#ff2bd6', '#ff9a3c', '#27e7ff'] as const

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
      <div id="cal-video-box" style="position:relative;border:1px solid #27e7ff;border-radius:8px;overflow:hidden;box-shadow:0 0 16px #27e7ff55;transform:scaleX(-1)"></div>
      <div id="cal-prompt" style="font-size:26px"></div>
      <div id="cal-hint" style="font-size:14px;color:#f6c;min-height:18px"></div>
      <div id="cal-progress" style="width:240px;height:6px;background:#222;border-radius:3px">
        <div id="cal-bar" style="height:100%;width:0%;background:#ff2bd6;border-radius:3px"></div>
      </div>
      <button id="cal-cancel" style="font:inherit;font-size:14px;padding:6px 16px;background:none;color:#888;border:1px solid #555;border-radius:6px;cursor:pointer">✕ Cancel — use keyboard instead</button>
    </div>`
    ui.appendChild(el)
    const videoBox = el.querySelector<HTMLElement>('#cal-video-box')!
    // The tracker's own <video> must NEVER enter the DOM: removing a playing media
    // element from the document pauses it (HTML spec), which froze face tracking on the
    // last calibration frame after this overlay was removed (issue #2). Instead, show a
    // separate PiP element sharing the same MediaStream. Raw video is allowed here only.
    const pip = document.createElement('video')
    pip.muted = true
    pip.playsInline = true
    pip.width = 320
    pip.height = 240
    pip.srcObject = source.video.srcObject
    void pip.play()
    videoBox.appendChild(pip)
    // Spark overlay: lives inside the mirrored video box, so drawing in raw
    // landmark coordinates mirrors along with the video — no manual flip.
    const fx = document.createElement('canvas')
    fx.width = 320
    fx.height = 240
    fx.style.cssText = 'position:absolute;inset:0;pointer-events:none'
    videoBox.appendChild(fx)
    const fxCtx = fx.getContext('2d')!
    const field = new ParticleField()
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

    let prevNow = performance.now()

    function tick(now: number): void {
      if (cancelled) return
      const dt = Math.min(0.05, (now - prevNow) / 1000)
      prevNow = now
      const step = STEPS[stepIndex]
      promptEl.textContent = step.prompt
      const elapsed = now - phaseStart
      const raw = source.readRaw()
      if (raw && step.fx) {
        field.emit(anchorsFrom(raw.landmarks, step.fx.indices), step.fx.intensity(raw), dt)
      }
      field.update(dt)
      fxCtx.clearRect(0, 0, fx.width, fx.height)
      fxCtx.globalCompositeOperation = 'lighter'
      for (const p of field.particles) {
        const t = 1 - p.age / p.life
        fxCtx.globalAlpha = 0.9 * t
        fxCtx.fillStyle = FX_COLORS[p.paletteIndex]
        const r = 1 + 2 * t
        fxCtx.fillRect(p.x * fx.width - r / 2, p.y * fx.height - r / 2, r, r)
      }
      fxCtx.globalAlpha = 1
      fxCtx.globalCompositeOperation = 'source-over'
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
