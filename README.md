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
