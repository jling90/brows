# Brows — Design Spec

A browser-based three.js endless runner where a mine Cart rides a Track through a cave, and the player sculpts the Track's elevation in real time with their eyebrows, read from the webcam. See `CONTEXT.md` for canonical terms (Brow Signal, Track, Pen, Dead Zone, Hazard, Run, Cart, Calibration).

## Input pipeline

1. **Capture**: `getUserMedia` webcam stream (front camera on mobile).
2. **Tracking**: MediaPipe Face Landmarker (`@mediapipe/tasks-vision`), in-browser WASM/GPU. Consume brow blendshapes (`browInnerUp`, `browDownLeft`, `browDownRight`); combine into one raw scalar (raise positive, furrow negative).
3. **Calibration**: pre-game three-step sequence — relax / raise / furrow — captures the player's neutral value and personal min/max range. Re-runnable from the menu. The Brow Signal is the raw scalar normalised against this range to −1…+1 (neutral = 0).
4. **Dead Zone**: ±15% (tunable) around neutral maps to exactly 0.
5. **Alternate source**: keyboard ↑/↓ implements the same `BrowSignalSource` interface for development and testing.

The tracker may run below render FPS on mobile; the Brow Signal is interpolated between tracker updates.

## Control model (ADR 0001)

- **Rate control**: Brow Signal sets the slope of new Track laid at the **Pen**, a point ~1 cart-second ahead of the Cart. Signal +1 = max climb rate, −1 = max descend rate, Dead Zone = level.
- Track behind the Pen is committed and immutable; the Cart follows it kinematically (no physics engine), tilting to match slope.
- Track elevation hard-clamps to the cave floor/ceiling band.
- Max climb/descend rate scales with scroll speed so steering authority is constant in screen terms.

## Game rules

- **Hazards**: stalagmites (floor), stalactites (ceiling), rock walls with a gap at a set height. Generated procedurally ahead of the Pen so they are visible before the Track reaching them is committed.
- **Fail**: Cart touches a Hazard → Run ends immediately. Score = distance travelled. High score persists in `localStorage`.
- **Difficulty**: scroll speed rises continuously with distance; hazard spacing is defined in seconds-at-current-speed so reaction windows shrink predictably. Two tunables: speed curve, spacing curve.
- **Face loss**: brief dropouts (<0.5s) hold the last Brow Signal; longer loss decays the signal to neutral and the Run continues. The brow meter grays out while the face is lost. Death while off-camera is accepted.

## Presentation

- **View**: side-scrolling 2.5D — perspective camera looking side-on; 3D low-poly procedural geometry (no asset files), flat shading, parallax cave layers for depth.
- **HUD**: distance score; slim vertical brow meter near the Pen showing live Brow Signal with the Dead Zone marked; webcam video toggleable during play.
- **Calibration screen**: webcam PiP with live meter; doubles as the tutorial.
- **Screens**: title → calibration → run → game over (score, high score, retry). Menu offers recalibration.
- **No audio in v1.**

## Platform (ADR 0002)

- Desktop and mobile browsers, static hosting, no backend.
- Mobile: landscape required (portrait shows a rotate-your-phone overlay and pauses); capped device pixel ratio; tracker permitted to run at reduced FPS with interpolation.

## Architecture

Vite + TypeScript. Pure logic modules, isolated from rendering and DOM, unit-tested with Vitest:

- `signal/` — blendshape combination, calibration math, normalisation, Dead Zone, face-loss decay; `BrowSignalSource` interface with MediaPipe and keyboard implementations
- `track/` — Pen advancement, slope integration, clamping, committed-track sampling
- `hazards/` — procedural placement (spacing in time-units), collision tests against Cart bounds
- `game/` — run state machine (title/calibrating/running/gameover), score, difficulty curves

Rendering (`render/`) consumes these models: three.js scene, track mesh regeneration at the Pen, hazard meshes, cart, parallax layers, HUD. The render layer holds no game rules.

## Dependencies & supply chain

Runtime: `three`, `@mediapipe/tasks-vision`. Dev: `vite`, `typescript`, `vitest`. Installed via `npm install --min-release-age=7`; lockfile committed and preserved.

## Testing

- Unit (Vitest): calibration normalisation, Dead Zone behaviour, slope integration + clamping, hazard spacing under speed ramp, collision detection, face-loss decay timing.
- Manual: real-webcam play on desktop Chrome/Safari/Firefox and mobile Safari/Chrome (landscape gate, perf).

## Out of scope (v1)

Audio, collectibles, stage themes, online leaderboards, per-brow independent control, portrait mobile layout.
