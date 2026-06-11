# Brows — Design Spec

A browser-based three.js endless runner where a mine Cart rides a Track through a cave. The player sculpts the Track's elevation with their eyebrows and opens Maw gaps with their mouth, both read from the webcam. See `CONTEXT.md` for canonical terms (Brow Signal, Mouth Signal, Track, Pen, Dead Zone, Hazard, Wall, Maw, Run, Cart, Calibration, Avatar).

## Input pipeline

1. **Capture**: `getUserMedia` webcam stream (front camera on mobile).
2. **Tracking**: MediaPipe Face Landmarker (`@mediapipe/tasks-vision`), in-browser WASM/GPU, with both blendshapes and the 478-point landmark mesh enabled. Brow blendshapes (`browInnerUp`, `browDownLeft`, `browDownRight`) combine into one raw brow scalar (raise positive, furrow negative); jaw blendshapes (`jawOpen`) produce a raw mouth scalar.
3. **Calibration**: pre-game four-step sequence — relax / raise / furrow / open wide — captures the player's neutral values and personal ranges for both channels. Re-runnable from the menu. The Brow Signal is normalised to −1…+1 (neutral = 0); the Mouth Signal is normalised to 0…1 (closed = 0, calibrated wide = 1).
4. **Dead Zone**: ±15% (tunable) around brow neutral maps to exactly 0. The Mouth Signal needs no dead zone (closed-mouth noise is absorbed by Maw aperture being smaller than the Cart below a floor threshold).
5. **Alternate source**: keyboard implements the same `FaceSignalSource` interface for development and testing — ↑/↓ for the Brow Signal, spacebar (hold) for the Mouth Signal.

The tracker may run below render FPS on mobile; the Brow Signal is interpolated between tracker updates.

## Control model (ADR 0001)

- **Rate control**: Brow Signal sets the slope of new Track laid at the **Pen**, a point ~1 cart-second ahead of the Cart. Signal +1 = max climb rate, −1 = max descend rate, Dead Zone = level.
- Track behind the Pen is committed and immutable; the Cart follows it kinematically (no physics engine), tilting to match slope.
- Track elevation hard-clamps to the cave floor/ceiling band.
- Max climb/descend rate scales with scroll speed so steering authority is constant in screen terms.

## Game rules

- **Hazards**: stalagmites (floor), stalactites (ceiling), Walls (fixed gap at a set height — brow-precision test), and Maws (toothy gap whose aperture tracks the live Mouth Signal, evaluated as the Cart crosses — mouth + brow combo test). All generated procedurally ahead of the Pen so they are visible before the Track reaching them is committed. Maw frequency is tuned to leave jaw-rest beats between encounters.
- **Fail**: Cart touches a Hazard → Run ends immediately. Score = distance travelled. High score persists in `localStorage`.
- **Difficulty**: scroll speed rises continuously with distance; hazard spacing is defined in seconds-at-current-speed so reaction windows shrink predictably. Two tunables: speed curve, spacing curve.
- **Face loss**: brief dropouts (<0.5s) hold the last signals; longer loss decays both signals to neutral (Brow Signal → 0 slope, Mouth Signal → 0, closing any Maw) and the Run continues. The Avatar freezes and grays out, and the brow meter dims, while the face is lost. Death while off-camera is accepted.

## Presentation

- **View**: side-scrolling 2.5D — perspective camera looking side-on; 3D low-poly procedural geometry (no asset files), parallax cave layers for depth.
- **Art direction (ADR 0003)**: neon wireframe synthwave. Full sunset gradient (magenta→orange→cyan) applied aesthetically across the scene by depth/height; hue carries no gameplay meaning. Readability rules: only gameplay-critical geometry (Hazards, Track, Pen, Cart) renders at full bloom intensity, scenery stays dim; deadly silhouettes are jagged, safe ones smooth. Maw seams pulse as they approach.
- **Rendering treatment**: solid near-black faces with emissive edge lines (`EdgesGeometry` + fat lines) — wireframe look with real occlusion. Bloom post-processing on desktop; mobile quality tier uses pre-brightened emissive colors with no bloom pass.
- **Avatar**: live low-poly face mesh built from tracker landmarks, shown in a screen corner during play in the same edge-glow style. It is the primary tracking feedback — it mirrors brows/mouth/head pose and grays out on face loss. No raw webcam video is shown during a Run.
- **HUD**: distance score; slim vertical brow meter near the Pen showing live Brow Signal with the Dead Zone marked.
- **Calibration screen**: webcam PiP with live meters for both channels; doubles as the tutorial. This is the only place raw video appears.
- **Screens**: title → calibration → run → game over (score, high score, retry). Menu offers recalibration.
- **No audio in v1.**

## Platform (ADR 0002)

- Desktop and mobile browsers, static hosting, no backend.
- Mobile: landscape required (portrait shows a rotate-your-phone overlay and pauses); capped device pixel ratio; tracker permitted to run at reduced FPS with interpolation.

## Architecture

Vite + TypeScript. Pure logic modules, isolated from rendering and DOM, unit-tested with Vitest:

- `signal/` — blendshape combination, calibration math, normalisation, Dead Zone, face-loss decay for both channels; `FaceSignalSource` interface (Brow Signal + Mouth Signal + raw landmarks) with MediaPipe and keyboard implementations
- `track/` — Pen advancement, slope integration, clamping, committed-track sampling
- `hazards/` — procedural placement (spacing in time-units), Maw aperture evaluation against the live Mouth Signal, collision tests against Cart bounds
- `game/` — run state machine (title/calibrating/running/gameover), score, difficulty curves

Rendering (`render/`) consumes these models: three.js scene, track mesh regeneration at the Pen, hazard meshes (including animated Maw aperture), cart, parallax layers, the Avatar (landmark-driven face mesh), gradient/edge-glow materials, bloom pass with mobile fallback, HUD. The render layer holds no game rules.

## Dependencies & supply chain

Runtime: `three`, `@mediapipe/tasks-vision`. Dev: `vite`, `typescript`, `vitest`. Installed via `npm install --min-release-age=7`; lockfile committed and preserved.

## Testing

- Unit (Vitest): calibration normalisation (both channels), Dead Zone behaviour, slope integration + clamping, hazard spacing under speed ramp, collision detection, Maw aperture-vs-cart pass/clip logic, face-loss decay timing.
- Manual: real-webcam play on desktop Chrome/Safari/Firefox and mobile Safari/Chrome (landscape gate, perf).

## Out of scope (v1)

Audio, collectibles, stage themes, online leaderboards, per-brow independent control, portrait mobile layout, mouth-shape matching (Maw aperture uses openness only), proximity heat-ramp hazard coloring.
