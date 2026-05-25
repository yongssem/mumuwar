import * as THREE from 'three'

const PARTICLE_COUNT = 18

export class BurstPool {
  constructor(scene) {
    this.scene = scene
    this.bursts = []
  }

  spawn(position, color, scale = 1) {
    const size = 0.15 * scale
    const geo = new THREE.BoxGeometry(size, size, size)
    const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 1 })
    const mesh = new THREE.InstancedMesh(geo, mat, PARTICLE_COUNT)
    mesh.position.copy(position)
    mesh.position.y = 1.2

    const particles = []
    const m = new THREE.Matrix4()
    const p = new THREE.Vector3()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3(1, 1, 1)
    const speedMul = scale
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2
      const vx = Math.cos(angle) * (0.08 + Math.random() * 0.06) * speedMul
      const vy = (0.12 + Math.random() * 0.08) * speedMul
      const vz = Math.sin(angle) * (0.08 + Math.random() * 0.06) * speedMul
      particles.push({ x: 0, y: 0, z: 0, vx, vy, vz })
      p.set(0, 0, 0)
      m.compose(p, q, s)
      mesh.setMatrixAt(i, m)
    }
    mesh.instanceMatrix.needsUpdate = true

    this.scene.add(mesh)
    this.bursts.push({ mesh, particles, life: 0, mat })
  }

  update(speed) {
    const m = new THREE.Matrix4()
    const p = new THREE.Vector3()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3(1, 1, 1)

    for (let bi = this.bursts.length - 1; bi >= 0; bi--) {
      const b = this.bursts[bi]
      b.life += 1
      // 배경처럼 카메라쪽으로 함께 흘러가게
      b.mesh.position.z += speed

      for (let i = 0; i < b.particles.length; i++) {
        const pt = b.particles[i]
        pt.vy -= 0.012
        pt.x += pt.vx
        pt.y += pt.vy
        pt.z += pt.vz
        p.set(pt.x, pt.y, pt.z)
        m.compose(p, q, s)
        b.mesh.setMatrixAt(i, m)
      }
      b.mesh.instanceMatrix.needsUpdate = true
      b.mat.opacity = Math.max(0, 1 - b.life / 40)

      if (b.life > 40) {
        this.scene.remove(b.mesh)
        b.mesh.geometry.dispose()
        b.mat.dispose()
        this.bursts.splice(bi, 1)
      }
    }
  }
}
