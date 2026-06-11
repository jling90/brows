import * as THREE from 'three'
import { CAVE_HEIGHT } from '../config'
import { gradientColor } from './palette'

export const FACE_COLOR = 0x05010a
export const GAMEPLAY_BRIGHT = 1.0 // full intensity: hazards, track, pen, cart
export const SCENERY_BRIGHT = 0.22 // dim: background cave

export function colorAtY(y: number, bright: number): THREE.Color {
  const [r, g, b] = gradientColor(y / CAVE_HEIGHT)
  return new THREE.Color(r * bright, g * bright, b * bright)
}

/** Solid dark faces + emissive edge lines — the neon wireframe treatment. */
export function makeNeon(geo: THREE.BufferGeometry, color: THREE.Color): THREE.Group {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: FACE_COLOR })))
  group.add(
    new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color })),
  )
  return group
}
