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
