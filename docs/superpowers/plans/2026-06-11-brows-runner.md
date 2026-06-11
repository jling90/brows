# Brows Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Brows endless runner: a mine Cart on a player-sculpted Track, steered by eyebrow (slope) and mouth (Maw aperture) signals from the webcam, rendered in neon synthwave three.js.

**Architecture:** Pure logic modules (`signal/`, `track/`, `hazards/`, `game/`) hold all game rules and are unit-tested with Vitest, no DOM/three.js. The render layer (`render/`) consumes those models. Input arrives through a `FaceSignalSource` interface with two implementations: keyboard (dev/testing, available from Task 5) and MediaPipe (Tasks 15–17). The game is keyboard-playable end-to-end after Task 14; face control layers on after.

**Tech Stack:** Vite, TypeScript, three.js, @mediapipe/tasks-vision, Vitest. Static hosting, no backend.

**Conventions:** World units: x = distance travelled (cart moves +x), y = elevation. Cave band y ∈ [0, 10]. Slope is dy/dx, so climb *rate* (dy/dt = slope × speed) scales with speed automatically, per spec. Supply-chain policy: all installs use `npm install --min-release-age=7`; never regenerate the lockfile.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.ts`, `src/config.ts`, `src/config.test.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "brows",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "setup:assets": "mkdir -p public/models public/wasm && cp -r node_modules/@mediapipe/tasks-vision/wasm/* public/wasm/ && curl -L -o public/models/face_landmarker.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
  }
}
```

- [ ] **Step 2: Install dependencies (supply-chain policy applies)**

Run:
```bash
npm install --min-release-age=7 three @mediapipe/tasks-vision
npm install --min-release-age=7 -D vite typescript vitest @types/three
```
Expected: lockfile created, no errors. If a package fails the release-age check, STOP and report which dependency failed — do not retry with different flags.

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": false,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: { target: 'es2022' },
})
```

- [ ] **Step 5: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <title>Brows</title>
    <style>
      html, body { margin: 0; height: 100%; background: #05010a; overflow: hidden; }
      #game { display: block; width: 100%; height: 100%; }
      #ui { position: fixed; inset: 0; pointer-events: none; font-family: ui-monospace, monospace; color: #fff; }
      #ui > * { pointer-events: auto; }
    </style>
  </head>
  <body>
    <canvas id="game"></canvas>
    <div id="ui"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Create src/config.ts (all tunables live here)**

```ts
// World geometry
export const CAVE_HEIGHT = 10
export const TRACK_MIN_Y = 1
export const TRACK_MAX_Y = 9
export const DX = 0.25 // track sample spacing (world units)

// Control
export const MAX_SLOPE = 0.9 // dy/dx at |brow| = 1
export const PEN_LEAD_S = 1.0 // Pen leads the Cart by this many seconds
export const DEAD_ZONE = 0.15
export const FACE_HOLD_S = 0.5 // hold last signals on face loss
export const FACE_DECAY_PER_S = 2.0 // then decay toward neutral at this rate

// Cart
export const CART_HALF_W = 0.6
export const CART_HALF_H = 0.5

// Hazards
export const HAZARD_HALF_W = 0.5
export const MAW_REST_S = 6 // min seconds between Maws
export const VIEW_AHEAD_S = 3 // hazards exist this far ahead of the Cart

// Difficulty
export const SPEED_START = 8
export const SPEED_PER_M = 0.05
export const SPEED_MAX = 24
export const SPACING_START_S = 2.2
export const SPACING_MIN_S = 0.9
export const SPACING_PER_M = 0.004
```

- [ ] **Step 7: Create src/config.test.ts (sanity: toolchain runs)**

```ts
import { expect, test } from 'vitest'
import { TRACK_MIN_Y, TRACK_MAX_Y, CAVE_HEIGHT } from './config'

test('track band sits inside the cave', () => {
  expect(TRACK_MIN_Y).toBeGreaterThanOrEqual(0)
  expect(TRACK_MAX_Y).toBeLessThanOrEqual(CAVE_HEIGHT)
})
```

- [ ] **Step 8: Create src/main.ts smoke scene (replaced in Task 12)**

```ts
import * as THREE from 'three'

const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(innerWidth, innerHeight)
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100)
camera.position.z = 5
const box = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
  new THREE.LineBasicMaterial({ color: 0x27e7ff }),
)
scene.add(box)
renderer.setAnimationLoop(() => {
  box.rotation.y += 0.01
  renderer.render(scene, camera)
})
```

- [ ] **Step 9: Create .gitignore**

```
node_modules/
dist/
public/wasm/
public/models/
```

- [ ] **Step 10: Fetch MediaPipe runtime assets**

Run: `npm run setup:assets`
Expected: `public/wasm/` contains `vision_wasm_internal.wasm` (and friends); `public/models/face_landmarker.task` is ~3–10 MB.

- [ ] **Step 11: Verify toolchain**

Run: `npx vitest run` → Expected: 1 test passes.
Run: `npm run dev` → open http://localhost:5173 → Expected: rotating cyan wireframe cube on near-black background. Stop the server.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html .gitignore src
git commit -m "chore: scaffold Vite+TS+three+vitest project with config and asset setup"
```

---

### Task 2: Signal types + calibration normalisation

**Files:**
- Create: `src/signal/types.ts`, `src/signal/calibration.ts`
- Test: `src/signal/calibration.test.ts`

- [ ] **Step 1: Create src/signal/types.ts (shared interface, no test needed)**

```ts
/** One tracker reading. brow ∈ [-1,1] calibrated (furrow…raise), mouth ∈ [0,1] calibrated (closed…wide). */
export interface FaceFrame {
  brow: number
  mouth: number
  /** 478×3 normalised landmark coords for the Avatar, or null if the source has none (keyboard). */
  landmarks: Float32Array | null
}

export interface FaceSignalSource {
  start(): Promise<void>
  /** Latest frame, or null when no face is detected. */
  read(): FaceFrame | null
  stop(): void
}
```

- [ ] **Step 2: Write failing tests**

```ts
import { describe, expect, test } from 'vitest'
import { normalizeBrow, normalizeMouth, type CalibrationData } from './calibration'

const c: CalibrationData = {
  browNeutral: 0.3, browRaised: 0.8, browFurrowed: 0.1,
  mouthClosed: 0.05, mouthOpen: 0.65,
}

describe('normalizeBrow', () => {
  test('neutral maps to 0', () => expect(normalizeBrow(0.3, c)).toBe(0))
  test('calibrated raise maps to 1', () => expect(normalizeBrow(0.8, c)).toBe(1))
  test('calibrated furrow maps to -1', () => expect(normalizeBrow(0.1, c)).toBe(-1))
  test('half raise maps to 0.5', () => expect(normalizeBrow(0.55, c)).toBeCloseTo(0.5))
  test('beyond calibrated raise clamps to 1', () => expect(normalizeBrow(0.95, c)).toBe(1))
  test('beyond calibrated furrow clamps to -1', () => expect(normalizeBrow(0.0, c)).toBe(-1))
  test('degenerate range yields 0, not NaN', () => {
    const flat = { ...c, browRaised: 0.3 }
    expect(normalizeBrow(0.5, flat)).toBe(0)
  })
})

describe('normalizeMouth', () => {
  test('closed maps to 0', () => expect(normalizeMouth(0.05, c)).toBe(0))
  test('calibrated open maps to 1', () => expect(normalizeMouth(0.65, c)).toBe(1))
  test('halfway maps to 0.5', () => expect(normalizeMouth(0.35, c)).toBeCloseTo(0.5))
  test('clamps below 0 and above 1', () => {
    expect(normalizeMouth(0.0, c)).toBe(0)
    expect(normalizeMouth(0.9, c)).toBe(1)
  })
  test('degenerate range yields 0, not NaN', () => {
    const flat = { ...c, mouthOpen: 0.05 }
    expect(normalizeMouth(0.5, flat)).toBe(0)
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/signal/calibration.test.ts`
Expected: FAIL — cannot resolve `./calibration`.

- [ ] **Step 4: Implement src/signal/calibration.ts**

```ts
export interface CalibrationData {
  browNeutral: number
  browRaised: number
  browFurrowed: number
  mouthClosed: number
  mouthOpen: number
}

const EPS = 1e-4

export function normalizeBrow(raw: number, c: CalibrationData): number {
  if (raw >= c.browNeutral) {
    const range = c.browRaised - c.browNeutral
    if (range < EPS) return 0
    return Math.min(1, (raw - c.browNeutral) / range)
  }
  const range = c.browNeutral - c.browFurrowed
  if (range < EPS) return 0
  return Math.max(-1, (raw - c.browNeutral) / range)
}

export function normalizeMouth(raw: number, c: CalibrationData): number {
  const range = c.mouthOpen - c.mouthClosed
  if (range < EPS) return 0
  return Math.min(1, Math.max(0, (raw - c.mouthClosed) / range))
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/signal/calibration.test.ts` → Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/signal
git commit -m "feat: calibration normalisation for brow and mouth signals"
```

---

### Task 3: Dead Zone

**Files:**
- Create: `src/signal/deadzone.ts`
- Test: `src/signal/deadzone.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { expect, test } from 'vitest'
import { applyDeadZone } from './deadzone'

test('values inside the dead zone are exactly 0', () => {
  expect(applyDeadZone(0.1, 0.15)).toBe(0)
  expect(applyDeadZone(-0.15, 0.15)).toBe(0)
  expect(applyDeadZone(0, 0.15)).toBe(0)
})

test('full deflection is preserved', () => {
  expect(applyDeadZone(1, 0.15)).toBe(1)
  expect(applyDeadZone(-1, 0.15)).toBe(-1)
})

test('output rescales smoothly from the dead zone edge (no jump)', () => {
  expect(applyDeadZone(0.150001, 0.15)).toBeCloseTo(0, 4)
  expect(applyDeadZone(0.575, 0.15)).toBeCloseTo(0.5) // midpoint of live range
  expect(applyDeadZone(-0.575, 0.15)).toBeCloseTo(-0.5)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/signal/deadzone.test.ts` → Expected: FAIL — cannot resolve `./deadzone`.

- [ ] **Step 3: Implement src/signal/deadzone.ts**

```ts
/** Zero inside ±dz, then rescale the remaining range so output still spans [-1, 1]. */
export function applyDeadZone(v: number, dz: number): number {
  const a = Math.abs(v)
  if (a <= dz) return 0
  return (Math.sign(v) * (a - dz)) / (1 - dz)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/signal/deadzone.test.ts` → Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/signal/deadzone.ts src/signal/deadzone.test.ts
git commit -m "feat: dead zone with rescaled output"
```

---

### Task 4: Face-loss conditioner (hold then decay)

**Files:**
- Create: `src/signal/conditioner.ts`
- Test: `src/signal/conditioner.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/signal/conditioner.test.ts` → Expected: FAIL — cannot resolve `./conditioner`.

- [ ] **Step 3: Implement src/signal/conditioner.ts**

```ts
import { FACE_DECAY_PER_S, FACE_HOLD_S } from '../config'

export interface ConditionedSignals {
  brow: number
  mouth: number
  faceLost: boolean
}

function moveToward(v: number, target: number, step: number): number {
  if (Math.abs(v - target) <= step) return target
  return v + Math.sign(target - v) * step
}

export class SignalConditioner {
  private brow = 0
  private mouth = 0
  private lostFor = 0

  constructor(
    private holdS: number = FACE_HOLD_S,
    private decayPerS: number = FACE_DECAY_PER_S,
  ) {}

  update(frame: { brow: number; mouth: number } | null, dt: number): ConditionedSignals {
    if (frame) {
      this.brow = frame.brow
      this.mouth = frame.mouth
      this.lostFor = 0
      return { brow: this.brow, mouth: this.mouth, faceLost: false }
    }
    const prevLost = this.lostFor
    this.lostFor += dt
    const decayTime = Math.min(dt, Math.max(0, this.lostFor - Math.max(this.holdS, prevLost)))
    if (decayTime > 0) {
      const step = this.decayPerS * decayTime
      this.brow = moveToward(this.brow, 0, step)
      this.mouth = moveToward(this.mouth, 0, step)
    }
    return { brow: this.brow, mouth: this.mouth, faceLost: true }
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/signal/conditioner.test.ts` → Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/signal/conditioner.ts src/signal/conditioner.test.ts
git commit -m "feat: face-loss conditioner with hold window and decay to neutral"
```

---

### Task 5: Keyboard source

**Files:**
- Create: `src/signal/keyboardSource.ts`
- Test: `src/signal/keyboardSource.test.ts` (pure mapping only; DOM wiring is a thin wrapper)

- [ ] **Step 1: Write failing tests**

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/signal/keyboardSource.test.ts` → Expected: FAIL — cannot resolve `./keyboardSource`.

- [ ] **Step 3: Implement src/signal/keyboardSource.ts**

```ts
import type { FaceFrame, FaceSignalSource } from './types'

export interface KeyState {
  up: boolean
  down: boolean
  space: boolean
}

export function keysToFrame(k: KeyState): FaceFrame {
  return {
    brow: (k.up ? 1 : 0) - (k.down ? 1 : 0),
    mouth: k.space ? 1 : 0,
    landmarks: null,
  }
}

/** Dev/test input: ↑/↓ = Brow Signal, hold Space = Mouth Signal. */
export class KeyboardSource implements FaceSignalSource {
  private keys: KeyState = { up: false, down: false, space: false }

  private onKey = (e: KeyboardEvent) => {
    const pressed = e.type === 'keydown'
    if (e.code === 'ArrowUp') this.keys.up = pressed
    else if (e.code === 'ArrowDown') this.keys.down = pressed
    else if (e.code === 'Space') this.keys.space = pressed
    else return
    e.preventDefault()
  }

  async start(): Promise<void> {
    addEventListener('keydown', this.onKey)
    addEventListener('keyup', this.onKey)
  }

  read(): FaceFrame | null {
    return keysToFrame(this.keys)
  }

  stop(): void {
    removeEventListener('keydown', this.onKey)
    removeEventListener('keyup', this.onKey)
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/signal/keyboardSource.test.ts` → Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/signal/keyboardSource.ts src/signal/keyboardSource.test.ts
git commit -m "feat: keyboard FaceSignalSource for dev and testing"
```

---

### Task 6: Track (Pen, slope integration, clamp, sampling)

**Files:**
- Create: `src/track/track.ts`
- Test: `src/track/track.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/track/track.test.ts` → Expected: FAIL — cannot resolve `./track`.

- [ ] **Step 3: Implement src/track/track.ts**

```ts
import { CAVE_HEIGHT, DX, TRACK_MAX_Y, TRACK_MIN_Y } from '../config'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Sampled polyline on a fixed DX grid. Samples behind the Pen are committed and immutable. */
export class Track {
  private startX = 0
  private ys: number[]

  constructor(startY: number = CAVE_HEIGHT / 2) {
    this.ys = [startY]
  }

  get penX(): number {
    return this.startX + (this.ys.length - 1) * DX
  }

  get penY(): number {
    return this.ys[this.ys.length - 1]
  }

  /** Append samples at the given slope (dy/dx) until the Pen reaches toX. */
  advancePen(toX: number, slope: number): void {
    while (this.penX + DX <= toX) {
      this.ys.push(clamp(this.penY + slope * DX, TRACK_MIN_Y, TRACK_MAX_Y))
    }
  }

  elevationAt(x: number): number {
    const f = (x - this.startX) / DX
    const i0 = clamp(Math.floor(f), 0, this.ys.length - 1)
    const i1 = Math.min(i0 + 1, this.ys.length - 1)
    const t = clamp(f - i0, 0, 1)
    return this.ys[i0] + (this.ys[i1] - this.ys[i0]) * t
  }

  prune(minX: number): void {
    let drop = Math.floor((minX - this.startX) / DX)
    drop = Math.max(0, Math.min(drop, this.ys.length - 1))
    this.ys.splice(0, drop)
    this.startX += drop * DX
  }

  points(x0: number, x1: number): { x: number; y: number }[] {
    const out: { x: number; y: number }[] = []
    for (let i = 0; i < this.ys.length; i++) {
      const x = this.startX + i * DX
      if (x >= x0 && x <= x1) out.push({ x, y: this.ys[i] })
    }
    return out
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/track/track.test.ts` → Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/track
git commit -m "feat: track with pen advancement, slope integration, clamping, pruning"
```

---

### Task 7: Difficulty curves

**Files:**
- Create: `src/game/difficulty.ts`
- Test: `src/game/difficulty.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { expect, test } from 'vitest'
import { spacingSecondsAt, speedAt } from './difficulty'
import { SPACING_MIN_S, SPACING_START_S, SPEED_MAX, SPEED_START } from '../config'

test('speed starts at SPEED_START and rises with distance', () => {
  expect(speedAt(0)).toBe(SPEED_START)
  expect(speedAt(100)).toBeGreaterThan(speedAt(50))
})

test('speed caps at SPEED_MAX', () => {
  expect(speedAt(1e6)).toBe(SPEED_MAX)
})

test('hazard spacing starts at SPACING_START_S and shrinks with distance', () => {
  expect(spacingSecondsAt(0)).toBe(SPACING_START_S)
  expect(spacingSecondsAt(200)).toBeLessThan(spacingSecondsAt(100))
})

test('spacing floors at SPACING_MIN_S', () => {
  expect(spacingSecondsAt(1e6)).toBe(SPACING_MIN_S)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/game/difficulty.test.ts` → Expected: FAIL — cannot resolve `./difficulty`.

- [ ] **Step 3: Implement src/game/difficulty.ts**

```ts
import {
  SPACING_MIN_S, SPACING_PER_M, SPACING_START_S,
  SPEED_MAX, SPEED_PER_M, SPEED_START,
} from '../config'

export function speedAt(distance: number): number {
  return Math.min(SPEED_MAX, SPEED_START + SPEED_PER_M * distance)
}

/** Hazard spacing in seconds-at-current-speed, so reaction windows shrink predictably. */
export function spacingSecondsAt(distance: number): number {
  return Math.max(SPACING_MIN_S, SPACING_START_S - SPACING_PER_M * distance)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/game/difficulty.test.ts` → Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game
git commit -m "feat: speed ramp and time-based hazard spacing curves"
```

---

### Task 8: Hazard types + spawner

**Files:**
- Create: `src/hazards/types.ts`, `src/hazards/spawner.ts`
- Test: `src/hazards/spawner.test.ts`

- [ ] **Step 1: Create src/hazards/types.ts**

```ts
export type Hazard =
  | { kind: 'stalagmite'; x: number; height: number } // rises from floor (y=0)
  | { kind: 'stalactite'; x: number; height: number } // hangs from ceiling
  | { kind: 'wall'; x: number; gapCenter: number; gapHalf: number } // fixed gap
  | { kind: 'maw'; x: number; gapCenter: number; maxHalf: number } // aperture = Mouth Signal × maxHalf
```

- [ ] **Step 2: Write failing tests**

```ts
import { expect, test } from 'vitest'
import { Spawner } from './spawner'
import { MAW_REST_S } from '../config'

/** rng stub: returns queued values, then repeats the last one. */
function rngFrom(values: number[]): () => number {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

test('fillTo populates hazards up to x and not beyond', () => {
  const s = new Spawner(rngFrom([0.5]), 40)
  s.fillTo(100, 10, 0)
  expect(s.hazards.length).toBeGreaterThan(0)
  expect(s.hazards.every((h) => h.x <= 100)).toBe(true)
  const count = s.hazards.length
  s.fillTo(100, 10, 0) // idempotent
  expect(s.hazards.length).toBe(count)
})

test('spacing follows spacingSecondsAt(distance) × speed', () => {
  const s = new Spawner(rngFrom([0.5]), 40)
  s.fillTo(100, 10, 0) // spacing at distance 0 = 2.2s × 10 = 22 units
  expect(s.hazards[1].x - s.hazards[0].x).toBeCloseTo(22)
})

test('a low roll spawns a maw, and maws respect the rest beat', () => {
  const s = new Spawner(rngFrom([0.0]), 40) // every roll wants a maw
  s.fillTo(400, 10, 0)
  const maws = s.hazards.filter((h) => h.kind === 'maw')
  expect(maws.length).toBeGreaterThan(1)
  for (let i = 1; i < maws.length; i++) {
    expect(maws[i].x - maws[i - 1].x).toBeGreaterThanOrEqual(MAW_REST_S * 10)
  }
})

test('hazard params stay inside the cave band', () => {
  const s = new Spawner(rngFrom([0.99, 0.99, 0.0, 0.0, 0.5, 0.5]), 40)
  s.fillTo(300, 10, 0)
  for (const h of s.hazards) {
    if (h.kind === 'stalagmite' || h.kind === 'stalactite') {
      expect(h.height).toBeGreaterThan(0)
      expect(h.height).toBeLessThan(10)
    } else {
      expect(h.gapCenter).toBeGreaterThan(0)
      expect(h.gapCenter).toBeLessThan(10)
    }
  }
})

test('prune removes hazards behind minX', () => {
  const s = new Spawner(rngFrom([0.5]), 40)
  s.fillTo(200, 10, 0)
  s.prune(100)
  expect(s.hazards.every((h) => h.x > 100)).toBe(true)
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/hazards/spawner.test.ts` → Expected: FAIL — cannot resolve `./spawner`.

- [ ] **Step 4: Implement src/hazards/spawner.ts**

```ts
import { MAW_REST_S } from '../config'
import { spacingSecondsAt } from '../game/difficulty'
import type { Hazard } from './types'

export class Spawner {
  hazards: Hazard[] = []
  private nextX: number
  private lastMawX = -Infinity

  constructor(
    private rng: () => number = Math.random,
    firstX = 40,
  ) {
    this.nextX = firstX
  }

  /** Spawn hazards until the frontier reaches x. Spacing is seconds-at-current-speed. */
  fillTo(x: number, speed: number, distance: number): void {
    while (this.nextX < x) {
      this.hazards.push(this.make(this.nextX, speed))
      this.nextX += spacingSecondsAt(distance) * speed
    }
  }

  private make(x: number, speed: number): Hazard {
    const mawAllowed = x - this.lastMawX >= MAW_REST_S * speed
    const r = this.rng()
    if (mawAllowed && r < 0.2) {
      this.lastMawX = x
      return { kind: 'maw', x, gapCenter: this.range(3, 7), maxHalf: 1.6 }
    }
    if (r < 0.45) return { kind: 'stalagmite', x, height: this.range(2.5, 5.5) }
    if (r < 0.7) return { kind: 'stalactite', x, height: this.range(2.5, 5.5) }
    return { kind: 'wall', x, gapCenter: this.range(2.5, 7.5), gapHalf: 1.4 }
  }

  private range(a: number, b: number): number {
    return a + (b - a) * this.rng()
  }

  prune(minX: number): void {
    this.hazards = this.hazards.filter((h) => h.x > minX)
  }
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/hazards/spawner.test.ts` → Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hazards
git commit -m "feat: procedural hazard spawner with maw rest beats"
```

---

### Task 9: Collision (including live Maw aperture)

**Files:**
- Create: `src/hazards/collision.ts`
- Test: `src/hazards/collision.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { expect, test } from 'vitest'
import { anyCollision, cartBounds, hits } from './collision'
import type { Hazard } from './types'

// Cart at trackY=4: bounds y ∈ [4, 5], x ∈ [cartX−0.6, cartX+0.6]

test('cartBounds sits on the track and spans the cart box', () => {
  expect(cartBounds(10, 4)).toEqual({ minX: 9.4, maxX: 10.6, minY: 4, maxY: 5 })
})

test('no hit when horizontally clear of the hazard', () => {
  const h: Hazard = { kind: 'stalagmite', x: 20, height: 9 }
  expect(hits(h, cartBounds(10, 4), 0)).toBe(false)
})

test('stalagmite hits when cart bottom is below its tip', () => {
  const h: Hazard = { kind: 'stalagmite', x: 10, height: 4.5 }
  expect(hits(h, cartBounds(10, 4), 0)).toBe(true) // cart bottom 4 < 4.5
  expect(hits(h, cartBounds(10, 5), 0)).toBe(false) // cart bottom 5 > 4.5
})

test('stalactite hits when cart top is above its tip', () => {
  const h: Hazard = { kind: 'stalactite', x: 10, height: 4.5 } // tip at y = 10 − 4.5 = 5.5
  expect(hits(h, cartBounds(10, 5), 0)).toBe(true) // cart top 6 > 5.5
  expect(hits(h, cartBounds(10, 4), 0)).toBe(false) // cart top 5 < 5.5
})

test('wall passes only when the cart fits inside the fixed gap', () => {
  const h: Hazard = { kind: 'wall', x: 10, gapCenter: 5, gapHalf: 1.4 }
  expect(hits(h, cartBounds(10, 4.1), 0)).toBe(false) // cart y ∈ [4.1, 5.1] inside [3.6, 6.4]
  expect(hits(h, cartBounds(10, 6), 0)).toBe(true) // top 7 > 6.4
  expect(hits(h, cartBounds(10, 3), 0)).toBe(true) // bottom 3 < 3.6
})

test('maw aperture tracks the live Mouth Signal', () => {
  const h: Hazard = { kind: 'maw', x: 10, gapCenter: 4.5, maxHalf: 1.6 }
  // Cart y ∈ [4, 5]; needs aperture half ≥ 0.5 → mouth ≥ 0.3125
  expect(hits(h, cartBounds(10, 4), 1)).toBe(false) // wide open
  expect(hits(h, cartBounds(10, 4), 0)).toBe(true) // closed mouth = sealed
  expect(hits(h, cartBounds(10, 4), 0.2)).toBe(true) // half-open squeeze clips
  expect(hits(h, cartBounds(10, 4), 0.4)).toBe(false) // open enough
})

test('anyCollision scans all hazards', () => {
  const hazards: Hazard[] = [
    { kind: 'stalagmite', x: 50, height: 9 },
    { kind: 'wall', x: 10, gapCenter: 5, gapHalf: 1.4 },
  ]
  expect(anyCollision(hazards, 10, 4.1, 0)).toBe(false)
  expect(anyCollision(hazards, 10, 7, 0)).toBe(true)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/hazards/collision.test.ts` → Expected: FAIL — cannot resolve `./collision`.

- [ ] **Step 3: Implement src/hazards/collision.ts**

```ts
import { CART_HALF_H, CART_HALF_W, CAVE_HEIGHT, HAZARD_HALF_W } from '../config'
import type { Hazard } from './types'

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** Cart box: rests on the track, 2×CART_HALF_W wide, 2×CART_HALF_H tall. */
export function cartBounds(cartX: number, trackY: number): Bounds {
  return {
    minX: cartX - CART_HALF_W,
    maxX: cartX + CART_HALF_W,
    minY: trackY,
    maxY: trackY + 2 * CART_HALF_H,
  }
}

export function hits(h: Hazard, b: Bounds, mouth: number): boolean {
  const cx = (b.minX + b.maxX) / 2
  if (Math.abs(h.x - cx) > CART_HALF_W + HAZARD_HALF_W) return false
  switch (h.kind) {
    case 'stalagmite':
      return b.minY < h.height
    case 'stalactite':
      return b.maxY > CAVE_HEIGHT - h.height
    case 'wall':
      return b.maxY > h.gapCenter + h.gapHalf || b.minY < h.gapCenter - h.gapHalf
    case 'maw': {
      const half = h.maxHalf * Math.min(1, Math.max(0, mouth))
      return b.maxY > h.gapCenter + half || b.minY < h.gapCenter - half
    }
  }
}

export function anyCollision(hazards: Hazard[], cartX: number, trackY: number, mouth: number): boolean {
  const b = cartBounds(cartX, trackY)
  return hazards.some((h) => hits(h, b, mouth))
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/hazards/collision.test.ts` → Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hazards/collision.ts src/hazards/collision.test.ts
git commit -m "feat: collision detection incl. mouth-driven maw aperture"
```

---

### Task 10: Game state machine

**Files:**
- Create: `src/game/game.ts`
- Test: `src/game/game.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
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
  const g = new Game(store, () => 0.99) // rng → all walls
  g.startRun()
  // Hold a full climb: the cart pins at the ceiling and must eventually hit a wall edge.
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/game/game.test.ts` → Expected: FAIL — cannot resolve `./game`.

- [ ] **Step 3: Implement src/game/game.ts**

```ts
import { DEAD_ZONE, MAX_SLOPE, PEN_LEAD_S, SPEED_START, VIEW_AHEAD_S } from '../config'
import { anyCollision } from '../hazards/collision'
import { Spawner } from '../hazards/spawner'
import { applyDeadZone } from '../signal/deadzone'
import { SignalConditioner, type ConditionedSignals } from '../signal/conditioner'
import type { FaceFrame } from '../signal/types'
import { Track } from '../track/track'
import { speedAt } from './difficulty'

export type Phase = 'title' | 'calibrating' | 'running' | 'gameover'

export interface KVStore {
  get(key: string): string | null
  set(key: string, value: string): void
}

export function browserStore(): KVStore {
  return {
    get: (k) => globalThis.localStorage?.getItem(k) ?? null,
    set: (k, v) => globalThis.localStorage?.setItem(k, v),
  }
}

const HIGH_SCORE_KEY = 'brows.highScore'
const PRUNE_BEHIND = 30

export class Game {
  phase: Phase = 'title'
  distance = 0
  speed = SPEED_START
  track = new Track()
  spawner: Spawner
  signals: ConditionedSignals = { brow: 0, mouth: 0, faceLost: false }
  highScore: number
  private conditioner = new SignalConditioner()

  constructor(
    private store: KVStore = browserStore(),
    private rng: () => number = Math.random,
  ) {
    this.spawner = new Spawner(rng)
    this.highScore = Number(store.get(HIGH_SCORE_KEY) ?? 0)
  }

  get cartX(): number {
    return this.distance
  }

  get cartY(): number {
    return this.track.elevationAt(this.cartX)
  }

  get score(): number {
    return Math.floor(this.distance)
  }

  startRun(): void {
    this.phase = 'running'
    this.distance = 0
    this.speed = SPEED_START
    this.track = new Track()
    this.spawner = new Spawner(this.rng)
    this.conditioner = new SignalConditioner()
  }

  update(dt: number, frame: FaceFrame | null): void {
    this.signals = this.conditioner.update(frame, dt)
    if (this.phase !== 'running') return

    this.speed = speedAt(this.distance)
    this.distance += this.speed * dt

    const slope = applyDeadZone(this.signals.brow, DEAD_ZONE) * MAX_SLOPE
    this.track.advancePen(this.cartX + this.speed * PEN_LEAD_S, slope)
    this.spawner.fillTo(this.cartX + this.speed * VIEW_AHEAD_S, this.speed, this.distance)
    this.track.prune(this.cartX - PRUNE_BEHIND)
    this.spawner.prune(this.cartX - PRUNE_BEHIND)

    if (anyCollision(this.spawner.hazards, this.cartX, this.cartY, this.signals.mouth)) {
      this.phase = 'gameover'
      if (this.score > this.highScore) {
        this.highScore = this.score
        this.store.set(HIGH_SCORE_KEY, String(this.highScore))
      }
    }
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/game/game.test.ts` → Expected: all PASS.
Run: `npx vitest run` → Expected: full suite PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/game.ts src/game/game.test.ts
git commit -m "feat: game state machine wiring signals, track, spawner, collision, high score"
```

---

### Task 11: Synthwave palette

**Files:**
- Create: `src/render/palette.ts`
- Test: `src/render/palette.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { expect, test } from 'vitest'
import { gradientColor, MAGENTA, ORANGE, CYAN } from './palette'

test('endpoints and midpoint hit the palette stops', () => {
  expect(gradientColor(0)).toEqual(MAGENTA)
  expect(gradientColor(0.5)).toEqual(ORANGE)
  expect(gradientColor(1)).toEqual(CYAN)
})

test('t clamps outside [0,1]', () => {
  expect(gradientColor(-1)).toEqual(MAGENTA)
  expect(gradientColor(2)).toEqual(CYAN)
})

test('interpolates linearly between stops', () => {
  const c = gradientColor(0.25)
  for (let i = 0; i < 3; i++) {
    expect(c[i]).toBeCloseTo((MAGENTA[i] + ORANGE[i]) / 2)
  }
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/render/palette.test.ts` → Expected: FAIL — cannot resolve `./palette`.

- [ ] **Step 3: Implement src/render/palette.ts**

```ts
export type RGB = [number, number, number]

export const MAGENTA: RGB = [1.0, 0.17, 0.84]
export const ORANGE: RGB = [1.0, 0.62, 0.24]
export const CYAN: RGB = [0.15, 0.91, 1.0]

const STOPS: [number, RGB][] = [
  [0, MAGENTA],
  [0.5, ORANGE],
  [1, CYAN],
]

/** Sunset gradient magenta→orange→cyan. Hue is aesthetic only (ADR 0003). */
export function gradientColor(t: number): RGB {
  const x = Math.min(1, Math.max(0, t))
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, c0] = STOPS[i]
    const [t1, c1] = STOPS[i + 1]
    if (x <= t1) {
      const f = (x - t0) / (t1 - t0)
      return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f]
    }
  }
  return CYAN
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/render/palette.test.ts` → Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render
git commit -m "feat: synthwave gradient palette"
```

---

### Task 12: Render layer — keyboard-playable game

This task is manual-verification (three.js/WebGL); the logic it consumes is already tested. Per ADR 0003: solid near-black faces + emissive edges; bright = gameplay, dim = scenery; jagged = deadly.

**Files:**
- Create: `src/render/materials.ts`, `src/render/scene.ts`, `src/render/trackMesh.ts`, `src/render/hazardMeshes.ts`, `src/render/cartMesh.ts`, `src/render/parallax.ts`
- Modify: `src/main.ts` (replace smoke scene)

- [ ] **Step 1: Create src/render/materials.ts**

```ts
import * as THREE from 'three'
import { CAVE_HEIGHT } from '../config'
import { gradientColor } from './palette'

export const FACE_COLOR = 0x05010a
export const GAMEPLAY_BRIGHT = 1.0 // full intensity: hazards, track, pen, cart
export const SCENERY_BRIGHT = 0.22 // dim: background cave

export function colorAtY(y: number, bright: number): THREE.Color {
  const [r, g, b] = gradientColor(y / CAVE_HEIGHT)
  return new THREE.Color(r * bright, g * bright, b * bright)
}

/** Solid dark faces + emissive edge lines — the neon wireframe treatment. */
export function makeNeon(geo: THREE.BufferGeometry, color: THREE.Color): THREE.Group {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: FACE_COLOR })))
  group.add(
    new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color })),
  )
  return group
}
```

- [ ] **Step 2: Create src/render/trackMesh.ts**

```ts
import * as THREE from 'three'
import { CAVE_HEIGHT } from '../config'
import type { Track } from '../track/track'
import { gradientColor } from './palette'

const MAX_POINTS = 512

/** Rebuilds the rail polyline each frame from track samples, with per-vertex gradient color. */
export class TrackMesh {
  readonly object: THREE.Line
  private positions = new Float32Array(MAX_POINTS * 3)
  private colors = new Float32Array(MAX_POINTS * 3)

  constructor() {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.object = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true }))
    this.object.frustumCulled = false
  }

  update(track: Track, x0: number, x1: number): void {
    const pts = track.points(x0, x1).slice(0, MAX_POINTS)
    for (let i = 0; i < pts.length; i++) {
      this.positions[i * 3] = pts[i].x
      this.positions[i * 3 + 1] = pts[i].y
      this.positions[i * 3 + 2] = 0
      const [r, g, b] = gradientColor(pts[i].y / CAVE_HEIGHT)
      this.colors[i * 3] = r
      this.colors[i * 3 + 1] = g
      this.colors[i * 3 + 2] = b
    }
    const geo = this.object.geometry
    geo.setDrawRange(0, pts.length)
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
  }
}
```

- [ ] **Step 3: Create src/render/cartMesh.ts**

```ts
import * as THREE from 'three'
import { CART_HALF_H, CART_HALF_W } from '../config'
import { colorAtY, GAMEPLAY_BRIGHT, makeNeon } from './materials'

/** Smooth silhouette (safe shape language): box body + circular wheels. */
export class CartMesh {
  readonly object = new THREE.Group()

  constructor() {
    const body = makeNeon(
      new THREE.BoxGeometry(CART_HALF_W * 2, CART_HALF_H * 2, 0.8),
      colorAtY(5, GAMEPLAY_BRIGHT),
    )
    body.position.y = CART_HALF_H
    this.object.add(body)
    for (const dx of [-0.35, 0.35]) {
      const wheel = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 17 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2
            return new THREE.Vector3(Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0)
          }),
        ),
        new THREE.LineBasicMaterial({ color: colorAtY(5, GAMEPLAY_BRIGHT) }),
      )
      wheel.position.set(dx, 0, 0.41)
      this.object.add(wheel)
    }
  }

  update(x: number, y: number, slope: number): void {
    this.object.position.set(x, y, 0)
    this.object.rotation.z = Math.atan(slope)
  }
}
```

- [ ] **Step 4: Create src/render/hazardMeshes.ts**

```ts
import * as THREE from 'three'
import { CAVE_HEIGHT, HAZARD_HALF_W } from '../config'
import type { Hazard } from '../hazards/types'
import { colorAtY, GAMEPLAY_BRIGHT, makeNeon } from './materials'

function spike(height: number, pointsUp: boolean): THREE.Group {
  // Jagged silhouette (deadly shape language): cone with 5 sides reads as a spike.
  const geo = new THREE.ConeGeometry(HAZARD_HALF_W, height, 5)
  const tipY = pointsUp ? height : CAVE_HEIGHT - height
  const g = makeNeon(geo, colorAtY(tipY, GAMEPLAY_BRIGHT))
  g.position.y = pointsUp ? height / 2 : CAVE_HEIGHT - height / 2
  if (!pointsUp) g.rotation.z = Math.PI
  return g
}

function slab(bottomY: number, topY: number, jaggedEnd: 'top' | 'bottom'): THREE.Group {
  const h = Math.max(0.01, topY - bottomY)
  const g = makeNeon(
    new THREE.BoxGeometry(HAZARD_HALF_W * 2, h, 1),
    colorAtY((bottomY + topY) / 2, GAMEPLAY_BRIGHT),
  )
  g.position.y = bottomY + h / 2
  // Teeth on the gap-facing end of a maw slab.
  const teethY = jaggedEnd === 'top' ? topY : bottomY
  const teeth = new THREE.Group()
  for (const dx of [-0.3, 0, 0.3]) {
    const tooth = makeNeon(
      new THREE.ConeGeometry(0.12, 0.45, 4),
      colorAtY(teethY, GAMEPLAY_BRIGHT),
    )
    tooth.position.set(dx, jaggedEnd === 'top' ? h / 2 + 0.22 : -h / 2 - 0.22, 0)
    if (jaggedEnd === 'bottom') tooth.rotation.z = Math.PI
    teeth.add(tooth)
  }
  g.add(teeth)
  return g
}

interface MawParts {
  group: THREE.Group
  lower: THREE.Group
  upper: THREE.Group
  gapCenter: number
  maxHalf: number
}

/** Keeps a three.js object per live hazard; maw slabs reposition with the live Mouth Signal. */
export class HazardMeshes {
  readonly object = new THREE.Group()
  private byHazard = new Map<Hazard, THREE.Object3D>()
  private maws = new Map<Hazard, MawParts>()

  update(hazards: Hazard[], mouth: number, timeS: number): void {
    const live = new Set(hazards)
    for (const [h, obj] of this.byHazard) {
      if (!live.has(h)) {
        this.object.remove(obj)
        this.byHazard.delete(h)
        this.maws.delete(h)
      }
    }
    for (const h of hazards) {
      if (!this.byHazard.has(h)) this.add(h)
    }
    for (const [, m] of this.maws) {
      const half = m.maxHalf * Math.min(1, Math.max(0, mouth))
      // Slabs slide apart as the mouth opens; seam pulses (ADR 0003).
      m.lower.position.y = m.gapCenter - half - CAVE_HEIGHT / 2
      m.upper.position.y = m.gapCenter + half + CAVE_HEIGHT / 2
      const pulse = 0.75 + 0.25 * Math.sin(timeS * 6)
      m.group.scale.setScalar(1)
      m.group.traverse((o) => {
        const line = o as THREE.LineSegments
        if ((line as any).isLineSegments || (line as any).isLineLoop) {
          ;(line.material as THREE.LineBasicMaterial).opacity = pulse
          ;(line.material as THREE.LineBasicMaterial).transparent = true
        }
      })
    }
  }

  private add(h: Hazard): void {
    let obj: THREE.Object3D
    switch (h.kind) {
      case 'stalagmite':
        obj = spike(h.height, true)
        break
      case 'stalactite':
        obj = spike(h.height, false)
        break
      case 'wall': {
        const g = new THREE.Group()
        g.add(slab(0, h.gapCenter - h.gapHalf, 'top'))
        g.add(slab(h.gapCenter + h.gapHalf, CAVE_HEIGHT, 'bottom'))
        obj = g
        break
      }
      case 'maw': {
        const g = new THREE.Group()
        // Full-height slabs whose centers slide; geometry spans the cave so closed = sealed.
        const lower = slab(0, CAVE_HEIGHT, 'top')
        const upper = slab(0, CAVE_HEIGHT, 'bottom')
        g.add(lower, upper)
        obj = g
        this.maws.set(h, { group: g, lower, upper, gapCenter: h.gapCenter, maxHalf: h.maxHalf })
        break
      }
    }
    obj.position.x = h.x
    this.object.add(obj)
    this.byHazard.set(h, obj)
  }
}
```

- [ ] **Step 5: Create src/render/parallax.ts**

```ts
import * as THREE from 'three'
import { CAVE_HEIGHT } from '../config'
import { colorAtY, SCENERY_BRIGHT } from './materials'

/** Dim jagged silhouette strips at depth, repeating every SPAN so they tile as the camera moves. */
export class Parallax {
  readonly object = new THREE.Group()
  private layers: { strip: THREE.Line; factor: number; span: number }[] = []

  constructor() {
    for (const [z, factor, roughness] of [
      [-5, 0.6, 1.6],
      [-10, 0.35, 2.4],
    ] as const) {
      for (const edge of ['floor', 'ceiling'] as const) {
        const span = 120
        const pts: THREE.Vector3[] = []
        for (let i = 0; i <= 60; i++) {
          const x = (i / 60) * span
          const jag = Math.abs(Math.sin(i * 2.7) * roughness)
          const y = edge === 'floor' ? jag : CAVE_HEIGHT - jag
          pts.push(new THREE.Vector3(x, y, z))
        }
        const strip = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({
            color: colorAtY(edge === 'floor' ? 1 : 9, SCENERY_BRIGHT),
          }),
        )
        strip.frustumCulled = false
        this.object.add(strip)
        this.layers.push({ strip, factor, span })
      }
    }
  }

  update(cameraX: number): void {
    for (const l of this.layers) {
      const drift = cameraX * l.factor
      l.strip.position.x = cameraX - (((cameraX - drift) % l.span) + l.span / 2)
    }
  }
}
```

- [ ] **Step 6: Create src/render/scene.ts**

```ts
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { CAVE_HEIGHT, DEAD_ZONE, MAX_SLOPE, TRACK_MAX_Y, TRACK_MIN_Y } from '../config'
import { applyDeadZone } from '../signal/deadzone'
import type { Game } from '../game/game'
import { CartMesh } from './cartMesh'
import { HazardMeshes } from './hazardMeshes'
import { Parallax } from './parallax'
import { TrackMesh } from './trackMesh'
import { colorAtY, GAMEPLAY_BRIGHT, SCENERY_BRIGHT } from './materials'

export const isMobile = () => navigator.maxTouchPoints > 0

const CAM_AHEAD = 8 // camera looks ahead of the cart
const VIEW_HALF = 25

export class GameRenderer {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private composer: EffectComposer | null = null
  private trackMesh = new TrackMesh()
  private cartMesh = new CartMesh()
  private hazardMeshes = new HazardMeshes()
  private parallax = new Parallax()
  private pen: THREE.Mesh
  private time = 0

  constructor(canvas: HTMLCanvasElement) {
    const mobile = isMobile()
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2))
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
    this.camera.position.set(CAM_AHEAD, CAVE_HEIGHT / 2, 16)

    this.scene.add(this.trackMesh.object, this.cartMesh.object, this.hazardMeshes.object, this.parallax.object)

    // Floor/ceiling bounds (dim scenery).
    for (const y of [0, CAVE_HEIGHT]) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1000, y, 0),
          new THREE.Vector3(100000, y, 0),
        ]),
        new THREE.LineBasicMaterial({ color: colorAtY(y, SCENERY_BRIGHT) }),
      )
      line.frustumCulled = false
      this.scene.add(line)
    }

    // The Pen: a small bright marker at the track frontier.
    this.pen = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.25),
      new THREE.MeshBasicMaterial({ color: colorAtY(5, GAMEPLAY_BRIGHT) }),
    )
    this.scene.add(this.pen)

    if (!mobile) {
      this.composer = new EffectComposer(this.renderer)
      this.composer.addPass(new RenderPass(this.scene, this.camera))
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.1, 0.6, 0.1))
    }

    this.resize()
    addEventListener('resize', () => this.resize())
  }

  private resize(): void {
    this.renderer.setSize(innerWidth, innerHeight)
    this.composer?.setSize(innerWidth, innerHeight)
    this.camera.aspect = innerWidth / innerHeight
    this.camera.updateProjectionMatrix()
  }

  render(game: Game, dt: number): void {
    this.time += dt
    const camX = game.cartX + CAM_AHEAD
    this.camera.position.x = camX
    this.camera.lookAt(camX, CAVE_HEIGHT / 2, 0)

    this.trackMesh.update(game.track, camX - VIEW_HALF, camX + VIEW_HALF)
    const slope = applyDeadZone(game.signals.brow, DEAD_ZONE) * MAX_SLOPE
    this.cartMesh.update(game.cartX, game.cartY, slope)
    this.hazardMeshes.update(game.spawner.hazards, game.signals.mouth, this.time)
    this.parallax.update(camX)
    this.pen.position.set(game.track.penX, game.track.penY, 0)
    this.pen.rotation.z = this.time * 2
    this.pen.position.y = Math.min(TRACK_MAX_Y, Math.max(TRACK_MIN_Y, this.pen.position.y))

    if (this.composer) this.composer.render()
    else this.renderer.render(this.scene, this.camera)
  }
}
```

- [ ] **Step 7: Replace src/main.ts (keyboard-playable loop)**

```ts
import { Game } from './game/game'
import { GameRenderer } from './render/scene'
import { KeyboardSource } from './signal/keyboardSource'
import type { FaceSignalSource } from './signal/types'

const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const game = new Game()
const renderer = new GameRenderer(canvas)
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
  renderer.render(game, dt)
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
```

- [ ] **Step 8: Manual verification**

Run: `npm run dev`, open http://localhost:5173. Verify each:
1. Press Enter → cart rolls right along a level rail; spinning Pen marker leads it.
2. Hold ↑ → track bends up at the Pen, cart follows ~1s later; release → levels off (rate control).
3. Hold ↑ continuously → track pins at the ceiling clamp, never exits the band.
4. Spikes, walls, and toothy maws scroll in; colors span magenta→orange→cyan by height; background strips are dim, gameplay geometry blooms.
5. Approach a maw with Space held → slabs part; release → they seal; passing sealed = game freezes (gameover phase).
6. Hit any hazard → motion stops. Enter restarts a fresh run.
7. Check the console for errors — must be none.

- [ ] **Step 9: Commit**

```bash
git add src/main.ts src/render
git commit -m "feat: synthwave render layer; game playable with keyboard"
```

---

### Task 13: HUD (score + brow meter)

**Files:**
- Create: `src/render/hud.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create src/render/hud.ts**

```ts
import { DEAD_ZONE } from '../config'
import type { Game } from '../game/game'

/** DOM HUD: score (top right) and the brow meter with the Dead Zone band marked. */
export class Hud {
  private score: HTMLDivElement
  private fill: HTMLDivElement
  private meter: HTMLDivElement

  constructor(ui: HTMLElement) {
    ui.insertAdjacentHTML(
      'beforeend',
      `<div id="hud" style="position:absolute;inset:0;pointer-events:none">
        <div id="score" style="position:absolute;top:16px;right:20px;font-size:22px;color:#9ef;text-shadow:0 0 8px #27e7ff"></div>
        <div id="meter" style="position:absolute;right:20px;top:50%;transform:translateY(-50%);width:10px;height:180px;border:1px solid #555;border-radius:5px">
          <div style="position:absolute;left:0;right:0;top:${50 - DEAD_ZONE * 50}%;height:${DEAD_ZONE * 100}%;background:#333"></div>
          <div id="meter-fill" style="position:absolute;left:1px;right:1px;height:8px;border-radius:4px;background:#27e7ff;box-shadow:0 0 8px #27e7ff"></div>
        </div>
      </div>`,
    )
    this.score = ui.querySelector('#score')!
    this.fill = ui.querySelector('#meter-fill')!
    this.meter = ui.querySelector('#meter')!
  }

  update(game: Game): void {
    this.score.textContent = `${game.score}m  HI ${game.highScore}m`
    // brow +1 → top of meter, −1 → bottom
    const t = (1 - game.signals.brow) / 2
    this.fill.style.top = `calc(${t * 100}% - 4px)`
    const dim = game.signals.faceLost
    this.fill.style.opacity = dim ? '0.3' : '1'
    this.meter.style.opacity = dim ? '0.5' : '1'
  }
}
```

- [ ] **Step 2: Wire into src/main.ts**

Add after `const renderer = ...`:

```ts
import { Hud } from './render/hud'

const hud = new Hud(document.querySelector<HTMLElement>('#ui')!)
```

And inside `tick`, after `game.update(...)`:

```ts
hud.update(game)
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Verify: score counts up during a run and freezes on gameover; HI persists across reloads (localStorage); meter pip tracks ↑/↓ with a visible gray Dead Zone band at center.

- [ ] **Step 4: Commit**

```bash
git add src/render/hud.ts src/main.ts
git commit -m "feat: score and brow meter HUD with dead zone band"
```

---

### Task 14: Screens — title, game over, rotate overlay

**Files:**
- Create: `src/screens/overlays.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create src/screens/overlays.ts**

```ts
const PANEL_STYLE =
  'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
  'justify-content:center;gap:16px;background:rgba(5,1,10,0.85);color:#fff;text-align:center'
const BTN_STYLE =
  'font:inherit;font-size:18px;padding:10px 28px;background:none;color:#27e7ff;' +
  'border:1px solid #27e7ff;border-radius:6px;cursor:pointer;box-shadow:0 0 12px #27e7ff55'

export interface Overlays {
  showTitle(onKeyboard: () => void, onCamera: () => void): void
  showGameOver(score: number, high: number, onRetry: () => void, onMenu: () => void): void
  hide(): void
}

export function createOverlays(ui: HTMLElement): Overlays {
  const el = document.createElement('div')
  ui.appendChild(el)

  // Rotate overlay: pure CSS, only bites on touch devices in portrait.
  ui.insertAdjacentHTML(
    'beforeend',
    `<style>
      #rotate { display: none; }
      @media (orientation: portrait) and (pointer: coarse) {
        #rotate { display: flex !important; }
      }
    </style>
    <div id="rotate" style="${PANEL_STYLE};z-index:10;display:none">
      <div style="font-size:48px">🔄</div>
      <div>Rotate your phone — Brows is a landscape game.</div>
    </div>`,
  )

  return {
    showTitle(onKeyboard, onCamera) {
      el.innerHTML = `<div style="${PANEL_STYLE}">
        <h1 style="margin:0;font-size:42px;color:#ff2bd6;text-shadow:0 0 16px #ff2bd6">BROWS</h1>
        <p style="max-width:420px">Raise your eyebrows to lay climbing track, furrow to dive.<br/>
        Open your mouth to part the Maws. Don't touch the rock.</p>
        <button id="play-cam" style="${BTN_STYLE}">▶ Play with camera</button>
        <button id="play-kb" style="${BTN_STYLE};opacity:0.7">Play with keyboard (↑ ↓ Space)</button>
      </div>`
      el.querySelector('#play-cam')!.addEventListener('click', onCamera)
      el.querySelector('#play-kb')!.addEventListener('click', onKeyboard)
    },
    showGameOver(score, high, onRetry, onMenu) {
      el.innerHTML = `<div style="${PANEL_STYLE}">
        <h2 style="margin:0;color:#ff2bd6">DERAILED</h2>
        <div style="font-size:24px">${score}m${score >= high ? ' — new best!' : ` · best ${high}m`}</div>
        <button id="retry" style="${BTN_STYLE}">↻ Ride again</button>
        <button id="menu" style="${BTN_STYLE};opacity:0.7">☰ Menu</button>
      </div>`
      el.querySelector('#retry')!.addEventListener('click', onRetry)
      el.querySelector('#menu')!.addEventListener('click', onMenu)
    },
    hide() {
      el.innerHTML = ''
    },
  }
}
```

- [ ] **Step 2: Rewrite src/main.ts with screen flow**

```ts
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
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Verify: title screen with two buttons; keyboard button starts a run; dying shows DERAILED with score and best; Ride again restarts; camera button shows the placeholder alert. In devtools device emulation (e.g. iPhone, portrait), the rotate overlay covers the screen; landscape hides it.

- [ ] **Step 4: Commit**

```bash
git add src/screens src/main.ts
git commit -m "feat: title, game over, and rotate overlays with screen flow"
```

---

### Task 15: MediaPipe source

**Files:**
- Create: `src/signal/mediapipeSource.ts`
- Test: `src/signal/mediapipeSource.test.ts` (pure blendshape→scalar mapping only; the tracker itself is manual-verified)

- [ ] **Step 1: Write failing tests for the pure mapping**

```ts
import { expect, test } from 'vitest'
import { rawBrowFromBlendshapes, rawMouthFromBlendshapes } from './mediapipeSource'

const shapes = (m: Record<string, number>) =>
  Object.entries(m).map(([categoryName, score]) => ({ categoryName, score }))

test('brow scalar = inner-up minus mean brow-down', () => {
  expect(
    rawBrowFromBlendshapes(shapes({ browInnerUp: 0.8, browDownLeft: 0.1, browDownRight: 0.3 })),
  ).toBeCloseTo(0.8 - 0.2)
})

test('missing categories default to 0', () => {
  expect(rawBrowFromBlendshapes(shapes({}))).toBe(0)
  expect(rawMouthFromBlendshapes(shapes({}))).toBe(0)
})

test('mouth scalar = jawOpen', () => {
  expect(rawMouthFromBlendshapes(shapes({ jawOpen: 0.55 }))).toBe(0.55)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/signal/mediapipeSource.test.ts` → Expected: FAIL — cannot resolve `./mediapipeSource`.

- [ ] **Step 3: Implement src/signal/mediapipeSource.ts**

```ts
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { normalizeBrow, normalizeMouth, type CalibrationData } from './calibration'
import type { FaceFrame, FaceSignalSource } from './types'

interface Category {
  categoryName: string
  score: number
}

const score = (cats: Category[], name: string) =>
  cats.find((c) => c.categoryName === name)?.score ?? 0

export function rawBrowFromBlendshapes(cats: Category[]): number {
  return score(cats, 'browInnerUp') - (score(cats, 'browDownLeft') + score(cats, 'browDownRight')) / 2
}

export function rawMouthFromBlendshapes(cats: Category[]): number {
  return score(cats, 'jawOpen')
}

export interface RawReading {
  brow: number
  mouth: number
  landmarks: Float32Array
}

export class MediaPipeSource implements FaceSignalSource {
  calibration: CalibrationData | null = null
  readonly video = document.createElement('video')
  private landmarker: FaceLandmarker | null = null
  private stream: MediaStream | null = null
  private landmarkBuf = new Float32Array(478 * 3)

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
    })
    this.video.srcObject = this.stream
    this.video.muted = true
    this.video.playsInline = true
    await this.video.play()
    const fileset = await FilesetResolver.forVisionTasks('/wasm')
    this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: 'GPU' },
      runningMode: 'VIDEO',
      outputFaceBlendshapes: true,
      numFaces: 1,
    })
  }

  /** Uncalibrated reading for the calibration screen. Null when no face. */
  readRaw(): RawReading | null {
    if (!this.landmarker || this.video.readyState < 2) return null
    const result = this.landmarker.detectForVideo(this.video, performance.now())
    const lm = result.faceLandmarks[0]
    const cats = result.faceBlendshapes?.[0]?.categories
    if (!lm || !cats) return null
    for (let i = 0; i < lm.length && i < 478; i++) {
      this.landmarkBuf[i * 3] = lm[i].x
      this.landmarkBuf[i * 3 + 1] = lm[i].y
      this.landmarkBuf[i * 3 + 2] = lm[i].z
    }
    return {
      brow: rawBrowFromBlendshapes(cats),
      mouth: rawMouthFromBlendshapes(cats),
      landmarks: this.landmarkBuf,
    }
  }

  /** Calibrated frame for the game. Null when no face or not yet calibrated. */
  read(): FaceFrame | null {
    const raw = this.readRaw()
    if (!raw || !this.calibration) return null
    return {
      brow: normalizeBrow(raw.brow, this.calibration),
      mouth: normalizeMouth(raw.mouth, this.calibration),
      landmarks: raw.landmarks,
    }
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.landmarker?.close()
    this.landmarker = null
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/signal/mediapipeSource.test.ts` → Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/signal/mediapipeSource.ts src/signal/mediapipeSource.test.ts
git commit -m "feat: MediaPipe FaceSignalSource with raw and calibrated reads"
```

---

### Task 16: Calibration screen + camera flow

**Files:**
- Create: `src/screens/calibrationScreen.ts`
- Modify: `src/main.ts` (replace `startCamera` placeholder)

- [ ] **Step 1: Create src/screens/calibrationScreen.ts**

```ts
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
```

- [ ] **Step 2: Replace `startCamera` in src/main.ts**

```ts
import { CalibrationCancelled, runCalibration } from './screens/calibrationScreen'
import { MediaPipeSource } from './signal/mediapipeSource'

async function startCamera(): Promise<void> {
  overlays.hide()
  const mp = new MediaPipeSource()
  try {
    await mp.start()
    game.phase = 'calibrating'
    mp.calibration = await runCalibration(ui, mp)
    source.stop()
    source = mp
    game.startRun()
  } catch (err) {
    mp.stop() // release camera tracks
    if (!(err instanceof CalibrationCancelled)) {
      console.error(err)
      alert('Camera unavailable — falling back to keyboard. (↑ ↓ Space)')
    }
    await startKeyboard()
  }
}
```

(Remove the placeholder `startCamera` from Task 14.)

- [ ] **Step 3: Manual verification (webcam required)**

Run: `npm run dev`. Click **Play with camera**, grant permission. Verify: mirrored video appears with 4 prompts in sequence and a progress bar per step; after "open wide" the run starts; raising brows lays climbing track, furrowing dives, opening your mouth parts maws; denying camera permission falls back to keyboard with the alert.

- [ ] **Step 4: Commit**

```bash
git add src/screens/calibrationScreen.ts src/main.ts
git commit -m "feat: 4-step calibration screen and camera game flow"
```

---

### Task 17: Avatar (low-poly face in the corner)

**Files:**
- Create: `src/render/avatar.ts`
- Modify: `src/render/scene.ts` (render avatar viewport), `src/main.ts` (pass landmarks + faceLost)

- [ ] **Step 1: Create src/render/avatar.ts**

```ts
import * as THREE from 'three'
import { FaceLandmarker } from '@mediapipe/tasks-vision'
import { gradientColor } from './palette'

const LOST_COLOR = new THREE.Color(0.35, 0.35, 0.35)

/** Live low-poly face: MediaPipe tessellation rendered as edge lines in a corner viewport. */
export class Avatar {
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.OrthographicCamera(-0.6, 0.6, 0.6, -0.6, 0.1, 10)
  private lines: THREE.LineSegments
  private positions: Float32Array
  private material: THREE.LineBasicMaterial
  private liveColor: THREE.Color
  hasFace = false

  constructor() {
    const pairs = FaceLandmarker.FACE_LANDMARKS_TESSELATION
    this.positions = new Float32Array(pairs.length * 2 * 3)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    const [r, g, b] = gradientColor(0.8)
    this.liveColor = new THREE.Color(r, g, b)
    this.material = new THREE.LineBasicMaterial({ color: this.liveColor, transparent: true, opacity: 0.9 })
    this.lines = new THREE.LineSegments(geo, this.material)
    this.lines.frustumCulled = false
    this.scene.add(this.lines)
    this.camera.position.z = 1
  }

  update(landmarks: Float32Array | null, faceLost: boolean): void {
    this.material.color = faceLost ? LOST_COLOR : this.liveColor
    if (!landmarks) {
      if (faceLost) return // keep last pose, grayed
      this.hasFace = false
      return
    }
    this.hasFace = true
    const pairs = FaceLandmarker.FACE_LANDMARKS_TESSELATION
    for (let i = 0; i < pairs.length; i++) {
      for (const [slot, idx] of [[0, pairs[i].start], [1, pairs[i].end]] as const) {
        const o = (i * 2 + slot) * 3
        // normalised video coords → centered, mirrored, y-up
        this.positions[o] = -(landmarks[idx * 3] - 0.5)
        this.positions[o + 1] = -(landmarks[idx * 3 + 1] - 0.5)
        this.positions[o + 2] = -landmarks[idx * 3 + 2]
      }
    }
    this.lines.geometry.attributes.position.needsUpdate = true
  }
}
```

- [ ] **Step 2: Render the avatar viewport in src/render/scene.ts**

Add to imports and fields:

```ts
import { Avatar } from './avatar'
```

Inside `GameRenderer`: add field `readonly avatar = new Avatar()`.

At the end of `render(game, dt)` replace the final composer/renderer block with:

```ts
    if (this.composer) this.composer.render()
    else this.renderer.render(this.scene, this.camera)

    if (this.avatar.hasFace) {
      const size = Math.min(150, innerWidth * 0.15)
      const pad = 12
      this.renderer.autoClear = false
      this.renderer.clearDepth()
      this.renderer.setScissorTest(true)
      this.renderer.setScissor(pad, innerHeight - size - pad, size, size)
      this.renderer.setViewport(pad, innerHeight - size - pad, size, size)
      this.renderer.render(this.avatar.scene, this.avatar.camera)
      this.renderer.setScissorTest(false)
      this.renderer.setViewport(0, 0, innerWidth, innerHeight)
      this.renderer.autoClear = true
    }
```

- [ ] **Step 3: Feed the avatar in src/main.ts**

Inside `tick`, after `game.update(dt, frame)` (capture the frame in a variable):

```ts
  const frame = source.read()
  game.update(dt, frame)
  renderer.avatar.update(frame?.landmarks ?? null, game.signals.faceLost)
```

(Adjust the existing `game.update(dt, source.read())` call to use the captured `frame`.)

- [ ] **Step 4: Manual verification (webcam required)**

Run: `npm run dev`, play with camera. Verify: a wireframe face mesh appears top-left during the run, mirroring your expressions (blink, brows, jaw) in the synthwave cyan-orange tone; covering the webcam grays/freezes the avatar and the brow meter dims while the track levels off (decay to neutral); keyboard mode shows no avatar.

- [ ] **Step 5: Commit**

```bash
git add src/render/avatar.ts src/render/scene.ts src/main.ts
git commit -m "feat: low-poly face avatar as primary tracking feedback"
```

---

### Task 18: Final verification + README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Full test suite**

Run: `npx vitest run` → Expected: all tests pass, 0 failures.

- [ ] **Step 2: Type-check and production build**

Run: `npm run build` → Expected: tsc clean, vite build outputs `dist/` with no errors.
Run: `npm run preview` and smoke-test the built version (title → keyboard run → game over → retry).

- [ ] **Step 3: Manual acceptance checklist (from spec)**

1. Calibration: 4 steps, mirrored video, run starts after.
2. Rate control: hold raise = climb until ceiling clamp; neutral = level; furrow = dive to floor clamp.
3. Dead Zone: resting face does not drift the track.
4. Pen leads cart ~1s; committed track never changes.
5. Hazards: spikes, walls, maws all appear; maw aperture follows mouth live; maws are visually toothy/pulsing vs flat walls.
6. Difficulty: noticeably faster + denser by ~500m.
7. Death/score: one hit ends run; score = distance; high score survives reload.
8. Face loss: cover camera → avatar grays, signals decay to neutral, run continues.
9. ADR 0003: scenery dim, gameplay bright/bloomed (desktop); no bloom pass on a touch device, but still legible.
10. Mobile (if device available): portrait shows rotate overlay; landscape plays.

- [ ] **Step 4: Write README.md**

```markdown
# Brows

A synthwave endless runner controlled by your face. Raise your eyebrows to lay
climbing track for your mine cart, furrow to dive, and open your mouth to part
the toothy Maws. Built with three.js + MediaPipe Face Landmarker — everything
runs in your browser; no video leaves your machine.

## Run it

    npm install --min-release-age=7
    npm run setup:assets   # fetches MediaPipe wasm + face model into public/
    npm run dev

Open http://localhost:5173 on a machine with a webcam (or play with ↑/↓/Space).

## Develop

    npm test        # Vitest unit suite (pure logic modules)
    npm run build   # type-check + production build

See `CONTEXT.md` for the domain glossary and `docs/adr/` for key decisions.
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: README with setup and play instructions"
```

---

## Self-Review (completed)

- **Spec coverage:** input pipeline (T2–5, 15), rate control + Pen + clamp (T6, T10), hazards incl. Maw aperture + rest beats (T8–9), difficulty (T7), one-hit death + high score (T10), face-loss decay (T4), side-scroll 2.5D + ADR 0003 art (T11–12), Avatar (T17), HUD/meter (T13), screens + calibration (T14, T16), mobile landscape gate + pixel cap + no-bloom fallback (T12, T14), supply chain (T1), testing (every logic task + T18 checklist). README (T18).
- **Placeholder scan:** none — every code step has full code; `startCamera` placeholder in T14 is explicitly replaced in T16.
- **Type consistency:** `FaceFrame`/`FaceSignalSource` (T2) used by keyboard (T5), game (T10), MediaPipe (T15); `KVStore` defined and used in T10; `gradientColor`/`colorAtY` defined T11/T12 before use; `Track.points` defined T6, used T12; `game.signals` (T10) used by HUD (T13), scene (T12), avatar wiring (T17).
