import * as THREE from 'three'
import { ROAD_WIDTH } from '../config.js'
import { loadEnemySprite, makeGroundShadow } from '../utils/spriteLoader.js'

// GAME_DESIGN v2.1 §10-3-2 — 적 종류별 행동/속도/충돌 데미지
export const ENEMY_TYPES = {
  HOMEWORK: { label: '숙제더미',   color: 0x8D6E63, hp: 2, speed: 0.05, score: 10, collisionDamage: 1 },
  NAG:      { label: '잔소리 풍선', color: 0xFBC02D, hp: 1, speed: 0.10, score: 15, collisionDamage: 1 },
  TROLL:    { label: '단톡방 트롤', color: 0x7E57C2, hp: 3, speed: 0.10, score: 25, collisionDamage: 2 },
  ZOMBIE:   { label: '폰 좀비',     color: 0x37474F, hp: 5, speed: 0.18, score: 40, collisionDamage: 3 },
}

// Phase 8.8: 적군별 스프라이트 파일/스케일
const ENEMY_SPRITES = {
  HOMEWORK: { file: 'homework-pile', scale: 1.0, shadow: 0.55 },
  NAG:      { file: 'nag-bubble',    scale: 1.0, shadow: 0.50 },
  TROLL:    { file: 'troll',         scale: 1.1, shadow: 0.65 },
  ZOMBIE:   { file: 'phone-zombie',  scale: 1.0, shadow: 0.55 },
}

export const ENEMY_HIT_RADIUS = 0.9   // v2.3: 1.5배 크기 보정
const CROWD_COLLIDE_Z = -0.5     // 적이 이 z 이상 들어오면 군단과 충돌
const CROWD_COLLIDE_X = 2.5      // v2.3: 적 크기 1.5배 보정

const DYING_FRAMES = 12
const WAVE_MIN = 3
const WAVE_MAX = 5

// 적 1개 그룹 생성: 그림자 + 스프라이트
function buildEnemyVisual(typeKey) {
  const cfg = ENEMY_SPRITES[typeKey]
  const group = new THREE.Group()
  const shadow = makeGroundShadow(cfg.shadow)
  group.add(shadow)
  const sprite = loadEnemySprite(cfg.file, cfg.scale)
  group.add(sprite)
  // 흔들림 기준 저장
  group.userData.sprite = sprite
  group.userData.restY = sprite.userData.restY
  group.userData.bobPhase = Math.random() * Math.PI * 2
  return group
}

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
    const mesh = buildEnemyVisual(typeKey)
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
        // 위로 튀어오르며 회전(스프라이트는 material.rotation으로) + 축소
        e.mesh.position.y = t * 1.5
        const spr = e.mesh.userData.sprite
        if (spr) spr.material.rotation += 0.18
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

      // Phase 8.8: 위아래 살짝 흔들기
      const spr = e.mesh.userData.sprite
      if (spr) {
        e.mesh.userData.bobPhase += 0.08
        spr.position.y = e.mesh.userData.restY + Math.sin(e.mesh.userData.bobPhase) * 0.08
      }

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
