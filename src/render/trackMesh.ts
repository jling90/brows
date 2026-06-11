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
