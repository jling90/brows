import * as THREE from 'three'

const canvas = document.querySelector<HTMLCanvasElement>('#game')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(innerWidth, innerHeight)
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100)
camera.position.z = 5
const box = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
  new THREE.LineBasicMaterial({ color: 0x27e7ff }),
)
scene.add(box)
renderer.setAnimationLoop(() => {
  box.rotation.y += 0.01
  renderer.render(scene, camera)
})
