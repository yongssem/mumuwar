import * as THREE from 'three'

// Phase 8.5: 파편 + 흰 섬광 + 충격파 링
// - spawn(position, color, scale=1, count=18) — 기본 파편 폭발
// - spawnFlash(position, scale=1.5) — 중심 흰 섬광
// - spawnShockwave(position, color, expandTo=3, frames=36) — 시안 링 확장

const DEFAULT_COUNT = 18

export class BurstPool {
  constructor(scene) {
    this.scene = scene
    this.bursts = []
    this.flashes = []
    this.rings = []
  }

  spawn(position, color, scale = 1, count = DEFAULT_COUNT) {
    const size = 0.15 * scale
    const geo = new THREE.BoxGeometry(size, size, size)
    const mat = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 1,
      emissive: color,
      emissiveIntensity: 0.6,
    })
    const mesh = new THREE.InstancedMesh(geo, mat, count)
    mesh.position.copy(position)
    mesh.position.y = 1.2

    const particles = []
    const m = new THREE.Matrix4()
    const p = new THREE.Vector3()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3(1, 1, 1)
    const speedMul = scale
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const vx = Math.cos(angle) * (0.10 + Math.random() * 0.10) * speedMul
      const vy = (0.15 + Math.random() * 0.12) * speedMul
      const vz = Math.sin(angle) * (0.10 + Math.random() * 0.10) * speedMul
      particles.push({ x: 0, y: 0, z: 0, vx, vy, vz })
      p.set(0, 0, 0)
      m.compose(p, q, s)
      mesh.setMatrixAt(i, m)
    }
    mesh.instanceMatrix.needsUpdate = true

    this.scene.add(mesh)
    this.bursts.push({ mesh, particles, life: 0, mat })

    // 동시 100개 캡
    while (this.bursts.length > 100) {
      const old = this.bursts.shift()
      this.scene.remove(old.mesh)
      old.mesh.geometry.dispose()
      old.mat.dispose()
    }
  }

  spawnFlash(position, scale = 1.5) {
    const geo = new THREE.SphereGeometry(0.4 * scale, 12, 12)
    const mat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(position)
    mesh.position.y = Math.max(mesh.position.y, 1.0)
    this.scene.add(mesh)
    this.flashes.push({ mesh, mat, life: 0, maxLife: 12, scale })
  }

  spawnShockwave(position, color = 0x00FFFF, expandTo = 3, frames = 36) {
    const geo = new THREE.RingGeometry(0.2, 0.3, 32)
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(position)
    mesh.position.y = 0.2
    mesh.rotation.x = -Math.PI / 2
    this.scene.add(mesh)
    this.rings.push({ mesh, mat, life: 0, maxLife: frames, expandTo })
  }

  update(speed) {
    const m = new THREE.Matrix4()
    const p = new THREE.Vector3()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3(1, 1, 1)

    // 파편
    for (let bi = this.bursts.length - 1; bi >= 0; bi--) {
      const b = this.bursts[bi]
      b.life += 1
      b.mesh.position.z += speed

      for (let i = 0; i < b.particles.length; i++) {
        const pt = b.particles[i]
        pt.vy -= 0.014
        pt.x += pt.vx
        pt.y += pt.vy
        pt.z += pt.vz
        p.set(pt.x, pt.y, pt.z)
        m.compose(p, q, s)
        b.mesh.setMatrixAt(i, m)
      }
      b.mesh.instanceMatrix.needsUpdate = true
      b.mat.opacity = Math.max(0, 1 - b.life / 45)

      if (b.life > 45) {
        this.scene.remove(b.mesh)
        b.mesh.geometry.dispose()
        b.mat.dispose()
        this.bursts.splice(bi, 1)
      }
    }

    // 흰 섬광
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i]
      f.life += 1
      f.mesh.position.z += speed
      const t = f.life / f.maxLife
      f.mat.opacity = Math.max(0, 1 - t)
      const scl = f.scale * (1 + t * 1.5)
      f.mesh.scale.setScalar(scl)
      if (f.life >= f.maxLife) {
        this.scene.remove(f.mesh)
        f.mesh.geometry.dispose()
        f.mat.dispose()
        this.flashes.splice(i, 1)
      }
    }

    // 충격파 링
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]
      r.life += 1
      r.mesh.position.z += speed
      const t = r.life / r.maxLife
      const scl = 1 + t * r.expandTo
      r.mesh.scale.setScalar(scl)
      r.mat.opacity = Math.max(0, 0.9 * (1 - t))
      if (r.life >= r.maxLife) {
        this.scene.remove(r.mesh)
        r.mesh.geometry.dispose()
        r.mat.dispose()
        this.rings.splice(i, 1)
      }
    }
  }
}
