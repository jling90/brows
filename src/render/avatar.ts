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
