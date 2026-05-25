import * as THREE from 'three'
import { ROAD_WIDTH } from '../config.js'

// GAME_DESIGN v2.1 §10-3-2 — 적 종류별 행동/속도/충돌 데미지
export const ENEMY_TYPES = {
  HOMEWORK: { label: '숙제더미',   color: 0x8D6E63, hp: 2, speed: 0.05, score: 10, collisionDamage: 1 },
  NAG:      { label: '잔소리 풍선', color: 0xFBC02D, hp: 1, speed: 0.10, score: 15, collisionDamage: 1 },
  TROLL:    { label: '단톡방 트롤', color: 0x7E57C2, hp: 3, speed: 0.10, score: 25, collisionDamage: 2 },
  ZOMBIE:   { label: '폰 좀비',     color: 0x37474F, hp: 5, speed: 0.18, score: 40, collisionDamage: 3 },
}

export const ENEMY_HIT_RADIUS = 0.9   // v2.3: 1.5배 크기 보정
const CROWD_COLLIDE_Z = -0.5     // 적이 이 z 이상 들어오면 군단과 충돌
const CROWD_COLLIDE_X = 2.5      // v2.3: 적 크기 1.5배 보정

// === §10-3-3 모양 빌더 ===

const BUILDERS = {
  // 책 3권 적층 — Phase 8.7: 다크 우드 + 가장자리 emissive
  HOMEWORK() {
    const group = new THREE.Group()
    const books = [
      { w: 0.85, h: 0.20, d: 0.6,  color: 0x3E2723 },
      { w: 0.75, h: 0.22, d: 0.55, color: 0x4E342E },
      { w: 0.8,  h: 0.17, d: 0.5,  color: 0x5D4037 },
    ]
    let y = 0
    for (const b of books) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, b.d),
        new THREE.MeshStandardMaterial({
          color: b.color,
          emissive: 0x5D4037,
          emissiveIntensity: 0.2,
          roughness: 0.7,
        }),
      )
      m.position.y = y + b.h / 2
      m.castShadow = true
      group.add(m)
      y += b.h
    }
    return group
  },
  // 구형 풍선 + 줄
  NAG() {
    const group = new THREE.Group()
    const balloon = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xFBC02D }),
    )
    balloon.position.y = 0.95
    balloon.castShadow = true
    group.add(balloon)
    // 줄 (얇은 cylinder)
    const string = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6),
      new THREE.MeshStandardMaterial({ color: 0xF57F17 }),
    )
    string.position.y = 0.27
    group.add(string)
    // 매듭
    const knot = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0xFBC02D }),
    )
    knot.position.y = 0.5
    knot.rotation.x = Math.PI
    group.add(knot)
    return group
  },
  // 뾰족한 오각뿔
  TROLL() {
    const group = new THREE.Group()
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.3, 5),
      new THREE.MeshStandardMaterial({ color: 0x7E57C2 }),
    )
    cone.position.y = 0.65
    cone.castShadow = true
    group.add(cone)
    // 빨간 눈 두 개 — 보스 같은 위협감
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xFF1744, emissive: 0xFF1744, emissiveIntensity: 0.7 })
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8)
    const eL = new THREE.Mesh(eyeGeo, eyeMat)
    eL.position.set(-0.13, 0.7, 0.32)
    group.add(eL)
    const eR = new THREE.Mesh(eyeGeo, eyeMat)
    eR.position.set(0.13, 0.7, 0.32)
    group.add(eR)
    return group
  },
  // 길쭉한 직사각형 (폰)
  ZOMBIE() {
    const group = new THREE.Group()
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 1.1, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x37474F }),
    )
    body.position.y = 0.55
    body.castShadow = true
    group.add(body)
    // 청록 화면 (좀비 폰의 발광)
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x00E5FF, emissiveIntensity: 0.6 }),
    )
    screen.position.set(0, 0.55, 0.065)
    group.add(screen)
    return group
  },
}

const DYING_FRAMES = 12
const ENEMY_SCALE = 1.5  // v2.3: 1.5배 크게
const WAVE_MIN = 3
const WAVE_MAX = 5

export class EnemyManager {
  constructor(scene, { spawnList = [{ type: 'HOMEWORK', count: 5 }], spawnInterval = 60 } = {}) {
    this.scene = scene
    this.enemies = []
    this.spawnTimer = 30
    this.spawnInterval = spawnInterval     // v2.3: 1초 (60 frames)
    // 큐는 무한 순환 — duration 동안 끊임없이 등장
    this.queue = spawnList.flatMap((w) => Array(w.count).fill(w.type))
    this.spawned = 0
    this._forceWaveCountdown = 0
    this._stopped = false
  }

  stopSpawning() { this._stopped = true }

  // 단일 적 spawn (옵션으로 X/Z 오프셋)
  spawn(opts = {}) {
    if (this._stopped) return
    const typeKey = this.queue[this.spawned % this.queue.length]
    const t = ENEMY_TYPES[typeKey]
    const mesh = BUILDERS[typeKey]()
    mesh.scale.setScalar(ENEMY_SCALE)
    const baseX = (Math.random() - 0.5) * (ROAD_WIDTH - 2.5)
    const x = Math.max(-3.5, Math.min(3.5, baseX + (opts.xOffset || 0)))
    const z = -38 + (opts.zOffset || 0)
    mesh.position.set(x, 0, z)
    this.scene.add(mesh)
    this.enemies.push({
      typeKey, type: t, mesh,
      hp: t.hp, x, z,
      dead: false, dying: false, dyingTimer: 0,
    })
    this.spawned += 1
  }

  // 떼거리 wave (3~5마리, 좌우+앞뒤 분산)
  spawnWave() {
    if (this._stopped) return
    const count = WAVE_MIN + Math.floor(Math.random() * (WAVE_MAX - WAVE_MIN + 1))
    for (let i = 0; i < count; i++) {
      this.spawn({
        xOffset: (i - (count - 1) / 2) * 1.2,
        zOffset: -i * 2,
      })
    }
  }

  // 게이트 통과 직후 외부 트리거 (delay 프레임 후 강제 웨이브)
  scheduleWave(delay = 30) {
    if (this._forceWaveCountdown <= 0 || delay < this._forceWaveCountdown) {
      this._forceWaveCountdown = delay
    }
  }

  update(envSpeed, leaderX, onCrowdHit, leaderZ = 0) {
    if (this._forceWaveCountdown > 0) {
      this._forceWaveCountdown -= 1
      if (this._forceWaveCountdown === 0) this.spawnTimer = this.spawnInterval
    }
    this.spawnTimer += 1
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0
      this.spawnWave()
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]

      if (e.dying) {
        e.dyingTimer += 1
        const t = e.dyingTimer / DYING_FRAMES
        e.mesh.position.y = t * 1.5
        e.mesh.rotation.z += 0.18
        const s = Math.max(0.01, 1 - t)
        e.mesh.scale.setScalar(s)
        if (e.dyingTimer >= DYING_FRAMES) {
          this._dispose(e.mesh)
          this.enemies.splice(i, 1)
        }
        continue
      }

      e.z += envSpeed + e.type.speed
      e.mesh.position.z = e.z

      // 군단 충돌 (적이 군단 영역 진입 + leaderX와 X축 근접) — Phase 8.6: 리더 z 따라 라인 이동
      if (!e.dead && e.z >= CROWD_COLLIDE_Z + leaderZ && Math.abs(e.x - leaderX) <= CROWD_COLLIDE_X) {
        e.dead = true
        e.dying = true
        onCrowdHit?.(e)
        continue
      }

      // 너무 뒤로 흘러가면 그냥 제거 (이론상 도달 전에 충돌함)
      if (e.z > 10) {
        this._dispose(e.mesh)
        this.enemies.splice(i, 1)
      }
    }
  }

  nearest(leaderX, leaderZ = 0) {
    let best = null
    let bestDist = Infinity
    for (const e of this.enemies) {
      if (e.dead) continue
      if (e.z > leaderZ) continue
      const dx = e.x - leaderX
      const dz = e.z - leaderZ
      const d = dx * dx + dz * dz
      if (d < bestDist) { bestDist = d; best = e }
    }
    return best
  }

  checkBulletHit(bullet) {
    const r2 = ENEMY_HIT_RADIUS * ENEMY_HIT_RADIUS
    for (const e of this.enemies) {
      if (e.dead) continue
      const dx = e.x - bullet.x
      const dz = e.z - bullet.z
      if (dx * dx + dz * dz <= r2) {
        e.hp -= bullet.damage
        if (e.hp <= 0) {
          e.dead = true
          e.dying = true
          return { hit: true, killed: true, enemy: e }
        }
        return { hit: true, killed: false, enemy: e }
      }
    }
    return null
  }

  finished() {
    // stopSpawning 호출됐고 화면에 살아있는 적 0
    const alive = this.enemies.filter((e) => !e.dying).length
    return this._stopped && alive === 0
  }

  _dispose(mesh) {
    this.scene.remove(mesh)
    mesh.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => m.dispose())
      }
    })
  }
}
