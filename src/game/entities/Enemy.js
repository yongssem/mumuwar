import * as THREE from 'three'
import { ROAD_WIDTH } from '../config.js'
import { loadEnemySprite, makeGroundShadow } from '../utils/spriteLoader.js'
import { DEFAULT_DIFFICULTY } from '../stages.js'

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

// Phase 9.0 — 변종 시스템
//  · basic: 기본 (대다수)
//  · elite: 빨간 틴트 + 빨간 오라 PointLight + HP 2.5×, 속도 1.2×, 점수 2×
//  · boss:  보라 틴트 + 보라 오라 + HP 5×, 속도 1.4×, 점수 4×
// 점수 배수는 HP 배수보다 살짝 낮게 설정 (어렵지만 보상도 따라옴).
export const ENEMY_VARIANTS = {
  basic: {
    tint: 0xFFFFFF,
    aura: null,
    auraIntensity: 0,
    hpMul: 1.0,
    scale: 1.0,
    speedMul: 1.0,
    scoreMul: 1.0,
  },
  elite: {
    tint: 0xFFAAAA,
    aura: 0xFF1744,
    auraIntensity: 1.5,
    hpMul: 2.5,
    scale: 1.1,
    speedMul: 1.2,
    scoreMul: 2.0,
  },
  boss: {
    tint: 0xAA88FF,
    aura: 0x7B1FA2,
    auraIntensity: 2.0,
    hpMul: 5.0,
    scale: 1.3,
    speedMul: 1.4,
    scoreMul: 4.0,
  },
}

export const ENEMY_HIT_RADIUS = 0.9   // v2.3: 1.5배 크기 보정
const CROWD_COLLIDE_Z = -0.5     // 적이 이 z 이상 들어오면 군단과 충돌
const CROWD_COLLIDE_X = 2.5      // v2.3: 적 크기 1.5배 보정

const DYING_FRAMES = 12

// 적 1개 그룹 생성: 그림자 + 스프라이트 (+ 변종 오라)
function buildEnemyVisual(typeKey, variantCfg) {
  const cfg = ENEMY_SPRITES[typeKey]
  const v = variantCfg
  const group = new THREE.Group()

  const shadow = makeGroundShadow(cfg.shadow * v.scale)
  group.add(shadow)

  const sprite = loadEnemySprite(cfg.file, cfg.scale * v.scale)
  // 변종 컬러 틴트 (multiplicative blending with texture)
  if (v.tint !== 0xFFFFFF) sprite.material.color.setHex(v.tint)
  group.add(sprite)

  group.userData.sprite = sprite
  group.userData.restY = sprite.userData.restY
  group.userData.bobPhase = Math.random() * Math.PI * 2

  // 변종 오라 — 도로를 비추는 PointLight (sprite는 unlit이라 영향 없음)
  if (v.aura) {
    const aura = new THREE.PointLight(v.aura, v.auraIntensity, 3, 1.5)
    aura.position.set(0, 0.6, 0)
    group.add(aura)
    group.userData.aura = aura
    group.userData.auraBase = v.auraIntensity
  }

  return group
}

export class EnemyManager {
  constructor(scene, { spawnList = [{ type: 'HOMEWORK', count: 5 }], difficulty } = {}) {
    this.scene = scene
    this.enemies = []
    this.difficulty = { ...DEFAULT_DIFFICULTY, ...(difficulty || {}) }
    // spawnInterval: 초 → 프레임 (60fps 기준)
    this.spawnInterval = Math.max(15, Math.round(this.difficulty.spawnInterval * 60))
    this.spawnTimer = 30
    // 큐는 무한 순환 — duration 동안 끊임없이 등장
    this.queue = spawnList.flatMap((w) => Array(w.count).fill(w.type))
    this.spawned = 0
    this._forceWaveCountdown = 0
    this._stopped = false
  }

  stopSpawning() { this._stopped = true }

  // 단일 적 spawn (옵션으로 X/Z 오프셋 + variant)
  spawn(opts = {}) {
    if (this._stopped) return
    const typeKey = this.queue[this.spawned % this.queue.length]
    const t = ENEMY_TYPES[typeKey]
    const variant = opts.variant || 'basic'
    const v = ENEMY_VARIANTS[variant] || ENEMY_VARIANTS.basic

    const mesh = buildEnemyVisual(typeKey, v)
    const baseX = (Math.random() - 0.5) * (ROAD_WIDTH - 2.5)
    const x = Math.max(-3.5, Math.min(3.5, baseX + (opts.xOffset || 0)))
    const z = -38 + (opts.zOffset || 0)
    mesh.position.set(x, 0, z)
    this.scene.add(mesh)

    // 스탯 = 베이스 × 변종 × 스테이지
    const stageHpMul = this.difficulty.hpMul
    const stageSpeedMul = this.difficulty.speedMul
    const hp = Math.max(1, Math.round(t.hp * v.hpMul * stageHpMul))
    const speedMul = v.speedMul * stageSpeedMul
    const score = Math.round(t.score * v.scoreMul)

    this.enemies.push({
      typeKey, type: t, mesh,
      variant,
      hp, speedMul, score,
      x, z,
      dead: false, dying: false, dyingTimer: 0,
    })
    this.spawned += 1
  }

  // Phase 9.0 — difficulty.spawnCount 만큼 동시 스폰, 각자 variant 롤
  spawnGroup() {
    if (this._stopped) return
    const count = Math.max(1, this.difficulty.spawnCount)
    for (let i = 0; i < count; i++) {
      const variant = this._rollVariant()
      this.spawn({
        xOffset: (i - (count - 1) / 2) * 1.5,
        zOffset: -i * 1.5,
        variant,
      })
    }
  }

  _rollVariant() {
    const r = Math.random()
    const { bossRate, eliteRate } = this.difficulty
    if (bossRate && r < bossRate) return 'boss'
    if (r < eliteRate) return 'elite'
    return 'basic'
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
      this.spawnGroup()
    }

    const auraTime = performance.now() * 0.005

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]

      if (e.dying) {
        e.dyingTimer += 1
        const t = e.dyingTimer / DYING_FRAMES
        e.mesh.position.y = t * 1.5
        const spr = e.mesh.userData.sprite
        if (spr) spr.material.rotation += 0.18
        const s = Math.max(0.01, 1 - t)
        e.mesh.scale.setScalar(s)
        // 사망 중에도 오라 페이드
        if (e.mesh.userData.aura) {
          e.mesh.userData.aura.intensity = e.mesh.userData.auraBase * (1 - t)
        }
        if (e.dyingTimer >= DYING_FRAMES) {
          this._dispose(e.mesh)
          this.enemies.splice(i, 1)
        }
        continue
      }

      e.z += envSpeed + e.type.speed * (e.speedMul || 1)
      e.mesh.position.z = e.z

      // 위아래 흔들기 + 변종 오라 펄스
      const spr = e.mesh.userData.sprite
      if (spr) {
        e.mesh.userData.bobPhase += 0.08
        spr.position.y = e.mesh.userData.restY + Math.sin(e.mesh.userData.bobPhase) * 0.08
      }
      if (e.mesh.userData.aura) {
        const pulse = 1 + Math.sin(auraTime + e.mesh.userData.bobPhase) * 0.4
        e.mesh.userData.aura.intensity = e.mesh.userData.auraBase * pulse
      }

      // 군단 충돌 (적이 군단 영역 진입 + leaderX와 X축 근접)
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
