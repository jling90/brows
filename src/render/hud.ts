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
