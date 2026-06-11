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
