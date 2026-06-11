import * as THREE from 'three'
import { CAVE_HEIGHT, HAZARD_HALF_W } from '../config'
import type { Hazard } from '../hazards/types'
import { colorAtY, GAMEPLAY_BRIGHT, makeNeon } from './materials'

function spike(height: number, pointsUp: boolean): THREE.Group {
  // Jagged silhouette (deadly shape language): cone with 5 sides reads as a spike.
  const geo = new THREE.ConeGeometry(HAZARD_HALF_W, height, 5)
  const tipY = pointsUp ? height : CAVE_HEIGHT - height
  const g = makeNeon(geo, colorAtY(tipY, GAMEPLAY_BRIGHT))
  g.position.y = pointsUp ? height / 2 : CAVE_HEIGHT - height / 2
  if (!pointsUp) g.rotation.z = Math.PI
  return g
}

function slab(bottomY: number, topY: number, jaggedEnd: 'top' | 'bottom'): THREE.Group {
  const h = Math.max(0.01, topY - bottomY)
  const g = makeNeon(
    new THREE.BoxGeometry(HAZARD_HALF_W * 2, h, 1),
    colorAtY((bottomY + topY) / 2, GAMEPLAY_BRIGHT),
  )
  g.position.y = bottomY + h / 2
  // Teeth on the gap-facing end of a maw slab.
  const teethY = jaggedEnd === 'top' ? topY : bottomY
  const teeth = new THREE.Group()
  for (const dx of [-0.3, 0, 0.3]) {
    const tooth = makeNeon(
      new THREE.ConeGeometry(0.12, 0.45, 4),
      colorAtY(teethY, GAMEPLAY_BRIGHT),
    )
    tooth.position.set(dx, jaggedEnd === 'top' ? h / 2 + 0.22 : -h / 2 - 0.22, 0)
    if (jaggedEnd === 'bottom') tooth.rotation.z = Math.PI
    teeth.add(tooth)
  }
  g.add(teeth)
  return g
}

interface MawParts {
  group: THREE.Group
  lower: THREE.Group
  upper: THREE.Group
  gapCenter: number
  maxHalf: number
}

/** Keeps a three.js object per live hazard; maw slabs reposition with the live Mouth Signal. */
export class HazardMeshes {
  readonly object = new THREE.Group()
  private byHazard = new Map<Hazard, THREE.Object3D>()
  private maws = new Map<Hazard, MawParts>()

  update(hazards: Hazard[], mouth: number, timeS: number): void {
    const live = new Set(hazards)
    for (const [h, obj] of this.byHazard) {
      if (!live.has(h)) {
        this.object.remove(obj)
        this.byHazard.delete(h)
        this.maws.delete(h)
      }
    }
    for (const h of hazards) {
      if (!this.byHazard.has(h)) this.add(h)
    }
    for (const [, m] of this.maws) {
      const half = m.maxHalf * Math.min(1, Math.max(0, mouth))
      // Slabs slide apart as the mouth opens; seam pulses (ADR 0003).
      m.lower.position.y = m.gapCenter - half - CAVE_HEIGHT / 2
      m.upper.position.y = m.gapCenter + half + CAVE_HEIGHT / 2
      const pulse = 0.75 + 0.25 * Math.sin(timeS * 6)
      m.group.scale.setScalar(1)
      m.group.traverse((o) => {
        const line = o as THREE.LineSegments
        if ((line as any).isLineSegments || (line as any).isLineLoop) {
          ;(line.material as THREE.LineBasicMaterial).opacity = pulse
          ;(line.material as THREE.LineBasicMaterial).transparent = true
        }
      })
    }
  }

  private add(h: Hazard): void {
    let obj: THREE.Object3D
    switch (h.kind) {
      case 'stalagmite':
        obj = spike(h.height, true)
        break
      case 'stalactite':
        obj = spike(h.height, false)
        break
      case 'wall': {
        const g = new THREE.Group()
        g.add(slab(0, h.gapCenter - h.gapHalf, 'top'))
        g.add(slab(h.gapCenter + h.gapHalf, CAVE_HEIGHT, 'bottom'))
        obj = g
        break
      }
      case 'maw': {
        const g = new THREE.Group()
        // Full-height slabs whose centers slide; geometry spans the cave so closed = sealed.
        const lower = slab(0, CAVE_HEIGHT, 'top')
        const upper = slab(0, CAVE_HEIGHT, 'bottom')
        g.add(lower, upper)
        obj = g
        this.maws.set(h, { group: g, lower, upper, gapCenter: h.gapCenter, maxHalf: h.maxHalf })
        break
      }
    }
    obj.position.x = h.x
    this.object.add(obj)
    this.byHazard.set(h, obj)
  }
}
