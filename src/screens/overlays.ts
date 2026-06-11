const PANEL_STYLE =
  'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
  'justify-content:center;gap:16px;background:rgba(5,1,10,0.85);color:#fff;text-align:center'
const BTN_STYLE =
  'font:inherit;font-size:18px;padding:10px 28px;background:none;color:#27e7ff;' +
  'border:1px solid #27e7ff;border-radius:6px;cursor:pointer;box-shadow:0 0 12px #27e7ff55'

export interface Overlays {
  showTitle(onKeyboard: () => void, onCamera: () => void): void
  showGameOver(score: number, high: number, onRetry: () => void): void
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
    <div id="rotate" style="${PANEL_STYLE};z-index:10">
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
    showGameOver(score, high, onRetry) {
      el.innerHTML = `<div style="${PANEL_STYLE}">
        <h2 style="margin:0;color:#ff2bd6">DERAILED</h2>
        <div style="font-size:24px">${score}m${score >= high ? ' — new best!' : ` · best ${high}m`}</div>
        <button id="retry" style="${BTN_STYLE}">↻ Ride again</button>
      </div>`
      el.querySelector('#retry')!.addEventListener('click', onRetry)
    },
    hide() {
      el.innerHTML = ''
    },
  }
}
