import * as THREE from 'three'
import { getWeaponFactory } from './weapons/index.js'

// v2.3.1 §8.0.5: 집중 포화 대응 — 풀 300, vx 분산, 머즐 30개 풀
// Phase 8.2: InstancedMesh → 무기별 Group 메쉬 풀 (시각 다양화)
const MAX_BULLETS = 200
const BULLET_SPEED = 1.4
const BULLET_MAX_RANGE = 50

const MUZZLE_FRAMES = 6
const MUZZLE_POOL_SIZE = 30

// 트레일 풀 (Lv3 연필용)
const TRAIL_POOL_SIZE = 80
const TRAIL_LIFE = 14
const TRAIL_EMIT_INTERVAL = 2

function disposeMesh(group) {
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose()
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.forEach((m) => m.dispose())
    }
  })
}

export class BulletPool {
  constructor(scene) {
    this.scene = scene
    this.weaponLv = 1
    this._factory = getWeaponFactory(1)

    // 머즐 플래시 텍스처 (sprite 풀 공유)
    const muzzleCanvas = document.createElement('canvas')
    muzzleCanvas.width = 64; muzzleCanvas.height = 64
    const mctx = muzzleCanvas.getContext('2d')
    const grad = mctx.createRadialGradient(32, 32, 4, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,200,1)')
    grad.addColorStop(0.4, 'rgba(255,200,0,0.8)')
    grad.addColorStop(1, 'rgba(255,160,0,0)')
    mctx.fillStyle = grad
    mctx.fillRect(0, 0, 64, 64)
    this.muzzleTex = new THREE.CanvasTexture(muzzleCanvas)
    this.muzzleTex.needsUpdate = true

    this.muzzles = []
    for (let i = 0; i < MUZZLE_POOL_SIZE; i++) {
      const mat = new THREE.SpriteMaterial({ map: this.muzzleTex, transparent: true, depthTest: false, depthWrite: false })
      const sprite = new THREE.Sprite(mat)
      sprite.scale.set(1.2, 1.2, 1)
      sprite.visible = false
      this.scene.add(sprite)
      this.muzzles.push({ sprite, mat, life: 0 })
    }

    // 트레일 풀 (재사용 sprite — Lv3에서만 활성)
    this._initTrailPool()

    // 총알 풀 — lazy mesh 생성
    this.bullets = []
    for (let i = 0; i < MAX_BULLETS; i++) {
      this.bullets.push({
        active: false,
        mesh: null,
        meshLv: 0,         // 메쉬가 생성된 시점의 weaponLv
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: -BULLET_SPEED,
        startZ: 0,
        damage: 1,
        rot: 0,            // 회전 누적값 (behavior별 의미 다름)
        trailTimer: 0,
      })
    }
  }

  _initTrailPool() {
    const canvas = document.createElement('canvas')
    canvas.width = 32; canvas.height = 32
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(16, 16, 1, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,235,100,1)')
    g.addColorStop(0.5, 'rgba(255,193,7,0.7)')
    g.addColorStop(1, 'rgba(255,160,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 32, 32)
    this.trailTex = new THREE.CanvasTexture(canvas)
    this.trailTex.needsUpdate = true

    this.trails = []
    for (let i = 0; i < TRAIL_POOL_SIZE; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.trailTex,
        transparent: true,
        depthWrite: false,
      })
      const sprite = new THREE.Sprite(mat)
      sprite.scale.set(0.45, 0.45, 1)
      sprite.visible = false
      this.scene.add(sprite)
      this.trails.push({ sprite, mat, life: 0 })
    }
  }

  _spawnTrail(x, y, z) {
    for (const t of this.trails) {
      if (t.life <= 0) {
        t.sprite.position.set(x, y, z)
        t.sprite.visible = true
        t.mat.opacity = 1
        t.life = TRAIL_LIFE
        return
      }
    }
  }

  // 무기 레벨 변경 — 기존 총알 메쉬 모두 폐기, 다음 spawn 시 새 메쉬 생성
  setWeaponLevel(lv) {
    if (lv === this.weaponLv) return
    this.weaponLv = lv
    this._factory = getWeaponFactory(lv)
    for (const b of this.bullets) {
      if (b.mesh) {
        this.scene.remove(b.mesh)
        disposeMesh(b.mesh)
        b.mesh = null
        b.meshLv = 0
      }
      b.active = false
    }
  }

  // 하위 호환 — 기존 호출자가 setColor(hex)를 부르면 무시 (메쉬 자체 색상 사용)
  setColor() {}

  flashMuzzleAt(x, y, z) {
    for (const m of this.muzzles) {
      if (m.life <= 0) {
        m.sprite.position.set(x, y, z)
        m.sprite.visible = true
        m.mat.opacity = 1
        m.life = MUZZLE_FRAMES
        return
      }
    }
  }

  spawn(x, z, damage, vx = 0, y = 1.0) {
    for (const b of this.bullets) {
      if (!b.active) {
        // lazy mesh 생성 / 현재 무기와 맞으면 재사용
        if (!b.mesh || b.meshLv !== this.weaponLv) {
          if (b.mesh) {
            this.scene.remove(b.mesh)
            disposeMesh(b.mesh)
          }
          b.mesh = this._factory.create()
          b.meshLv = this.weaponLv
          this.scene.add(b.mesh)
        }
        b.active = true
        b.mesh.visible = true
        b.x = x; b.y = y; b.z = z
        b.vx = vx
        b.vy = 0
        b.vz = -BULLET_SPEED
        b.startZ = z
        b.damage = damage
        b.rot = 0
        b.trailTimer = 0
        b.mesh.rotation.set(0, 0, 0)
        b.mesh.position.set(x, y, z)
        return
      }
    }
  }

  _deactivate(b) {
    b.active = false
    if (b.mesh) b.mesh.visible = false
  }

  update(envSpeed, onHitCheck) {
    // 머즐 플래시
    for (const m of this.muzzles) {
      if (m.life > 0) {
        m.life -= 1
        const t = m.life / MUZZLE_FRAMES
        m.mat.opacity = t
        m.sprite.scale.set(0.7 + t * 0.8, 0.7 + t * 0.8, 1)
        if (m.life <= 0) m.sprite.visible = false
      }
    }

    // 트레일 페이드
    for (const t of this.trails) {
      if (t.life > 0) {
        t.life -= 1
        const k = t.life / TRAIL_LIFE
        t.mat.opacity = k * 0.9
        const s = 0.25 + k * 0.35
        t.sprite.scale.set(s, s, 1)
        if (t.life <= 0) t.sprite.visible = false
      }
    }

    const behavior = this._factory.behavior

    for (const b of this.bullets) {
      if (!b.active) continue

      // behavior별 위치/회전 갱신
      switch (behavior) {
        case 'spin-y':
          b.z += b.vz
          b.x += b.vx
          b.rot += 0.4
          b.mesh.rotation.y = b.rot
          // 살짝 펄럭임
          b.mesh.position.y = b.y + Math.sin(b.rot * 2) * 0.04
          break
        case 'spin-z-pierce':
          b.z += b.vz
          b.x += b.vx
          b.rot += 0.6
          b.mesh.rotation.z = b.rot
          b.mesh.position.y = b.y
          break
        case 'straight-trail':
          b.z += b.vz * 1.3
          b.x += b.vx
          b.mesh.position.y = b.y
          b.trailTimer += 1
          if (b.trailTimer >= TRAIL_EMIT_INTERVAL) {
            b.trailTimer = 0
            this._spawnTrail(b.x, b.y, b.z + 0.3)
          }
          break
        case 'parabola-aoe':
          // 간단 포물선 (추후 광역 폭발은 다음 단계)
          b.z += b.vz
          b.x += b.vx
          b.rot += 0.15
          b.mesh.rotation.x = b.rot
          b.mesh.position.y = b.y
          break
        case 'pierce-shockwave':
          b.z += b.vz
          b.x += b.vx
          b.rot += 0.2
          b.mesh.rotation.z = b.rot
          // 오라 펄스
          for (const c of b.mesh.children) {
            if (c.userData.isAura) {
              const pulse = 1 + Math.sin(b.rot * 4) * 0.15
              c.scale.setScalar(pulse)
            }
          }
          b.mesh.position.y = b.y
          break
        default:
          b.z += b.vz
          b.x += b.vx
      }

      // 도로 스크롤 효과
      b.z += envSpeed

      // 충돌 판정 (Engine이 b를 받아 적/게이트/보스 체크)
      if (onHitCheck) {
        const hit = onHitCheck(b)
        if (hit) {
          this._deactivate(b)
          continue
        }
      }

      // 사거리/이탈 검사
      if (b.startZ - b.z > BULLET_MAX_RANGE || b.z < -100) {
        this._deactivate(b)
        continue
      }

      b.mesh.position.x = b.x
      b.mesh.position.z = b.z
    }
  }
}
