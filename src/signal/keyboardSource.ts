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
