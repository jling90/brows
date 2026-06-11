import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { CAVE_HEIGHT, DEAD_ZONE, MAX_SLOPE, TRACK_MAX_Y, TRACK_MIN_Y } from '../config'
import { applyDeadZone } from '../signal/deadzone'
import type { Game } from '../game/game'
import { Avatar } from './avatar'
import { CartMesh } from './cartMesh'
import { HazardMeshes } from './hazardMeshes'
import { Parallax } from './parallax'
import { TrackMesh } from './trackMesh'
import { colorAtY, GAMEPLAY_BRIGHT, SCENERY_BRIGHT } from './materials'

export const isMobile = () => navigator.maxTouchPoints > 0

const CAM_AHEAD = 8 // camera looks ahead of the cart
const VIEW_HALF = 25

// The Avatar renders as an enormous dim backdrop centered behind the gameplay
// plane (chosen over a corner PiP after playtesting: eyes live at the right
// screen edge, so a corner viewport was never seen). Low opacity keeps it
// below scenery in the ADR 0003 intensity hierarchy.
const BACKDROP_SCALE = 38 // mesh is ~1 unit tall → fills most of the view at z = −30
const BACKDROP_OPACITY = 0.20
const BACKDROP_Z = -30

export class GameRenderer {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private composer: EffectComposer | null = null
  private trackMesh = new TrackMesh()
  private cartMesh = new CartMesh()
  private hazardMeshes = new HazardMeshes()
  private parallax = new Parallax()
  readonly avatar = new Avatar()
  private avatarBackdrop: THREE.Object3D
  private pen: THREE.Mesh
  private time = 0

  constructor(canvas: HTMLCanvasElement) {
    const mobile = isMobile()
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2))
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
    this.camera.position.set(CAM_AHEAD, CAVE_HEIGHT / 2, 16)

    this.scene.add(this.trackMesh.object, this.cartMesh.object, this.hazardMeshes.object, this.parallax.object)

    this.avatarBackdrop = this.avatar.backdropObject(BACKDROP_SCALE, BACKDROP_OPACITY)
    this.scene.add(this.avatarBackdrop)

    // Floor/ceiling bounds (dim scenery).
    for (const y of [0, CAVE_HEIGHT]) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1000, y, 0),
          new THREE.Vector3(100000, y, 0),
        ]),
        new THREE.LineBasicMaterial({ color: colorAtY(y, SCENERY_BRIGHT) }),
      )
      line.frustumCulled = false
      this.scene.add(line)
    }

    // The Pen: a small bright marker at the track frontier.
    this.pen = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.25),
      new THREE.MeshBasicMaterial({ color: colorAtY(5, GAMEPLAY_BRIGHT) }),
    )
    this.scene.add(this.pen)

    if (!mobile) {
      this.composer = new EffectComposer(this.renderer)
      this.composer.addPass(new RenderPass(this.scene, this.camera))
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.1, 0.6, 0.1))
    }

    this.resize()
    addEventListener('resize', () => this.resize())
  }

  private resize(): void {
    this.renderer.setSize(innerWidth, innerHeight)
    this.composer?.setSize(innerWidth, innerHeight)
    this.camera.aspect = innerWidth / innerHeight
    this.camera.updateProjectionMatrix()
  }

  render(game: Game, dt: number): void {
    this.time += dt
    const camX = game.cartX + CAM_AHEAD
    this.camera.position.x = camX
    this.camera.lookAt(camX, CAVE_HEIGHT / 2, 0)

    this.trackMesh.update(game.track, camX - VIEW_HALF, camX + VIEW_HALF)
    const slope = applyDeadZone(game.signals.brow, DEAD_ZONE) * MAX_SLOPE
    this.cartMesh.update(game.cartX, game.cartY, slope)
    this.hazardMeshes.update(game.spawner.hazards, game.signals.mouth, this.time)
    this.parallax.update(camX)
    this.pen.position.set(game.track.penX, game.track.penY, 0)
    this.pen.rotation.z = this.time * 2
    this.pen.position.y = Math.min(TRACK_MAX_Y, Math.max(TRACK_MIN_Y, this.pen.position.y))

    // Hidden until landmarks exist: keyboard mode (and pre-first-detection) has
    // an all-zero buffer that would render as a single bloomed dot. Face loss
    // keeps hasFace true, so the frozen gray pose stays visible.
    this.avatarBackdrop.visible = this.avatar.hasFace
    this.avatarBackdrop.position.set(camX, CAVE_HEIGHT / 2, BACKDROP_Z)

    if (this.composer) this.composer.render()
    else this.renderer.render(this.scene, this.camera)
  }
}
