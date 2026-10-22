import * as THREE from 'three'
import { loadEnemySprite, makeGroundShadow } from '../utils/spriteLoader.js'

// Phase 5 데모 — 1스테이지 끝에 미니 보스로 등장
// GAME_DESIGN §5-3 최종 보스(학교폭력 우두머리)의 축소판:
// HP 100, 페이즈 1만 (멀리서 발사), 학생들 노트로 격파
export const BOSS = {
  maxHp: 100,
  size: 2.0,
  attackInterval: 150,      // 약 2.5초 @60fps
  bulletSpeed: 0.35,        // 학생 쪽으로 +z 방향
  bulletDamage: 5,          // 학생 군단 인원 차감
  hitRadius: 1.6,
  bulletHitRadius: 1.0,     // 학생 leader vs 보스 발사체
  bossZ: -22,
  color: 0x424242,
  accent: 0xB71C1C,
}

function buildBossMesh() {
  // Phase 8.8: boss-bully 픽셀아트 스프라이트로 교체
  const group = new THREE.Group()
  const shadow = makeGroundShadow(1.4)
  group.add(shadow)
  const sprite = loadEnemySprite('boss-bully', 2.5)
  group.add(sprite)
  group.userData.sprite = sprite
  group.userData.restY = sprite.userData.restY
  group.userData.bobPhase = 0
  return group
}

function buildBossBulletMesh() {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 14, 14),
    new THREE.MeshStandardMaterial({
      color: BOSS.accent,
      emissive: BOSS.accent,
      emissiveIntensity: 0.5,
    }),
  )
  mesh.visible = false
  return mesh
}

export class Boss {
  constructor(scene) {
    this.scene = scene
    this.hp = BOSS.maxHp
    this.alive = true
    this.attackTimer = 60
    this.swayPhase = 0
    this.warningFrames = 0
    this.targetX = 0
    this.targetZ = 0
    this.telegraph = new THREE.Mesh(
      new THREE.PlaneGeometry(BOSS.bulletHitRadius * 2, 34),
      new THREE.MeshBasicMaterial({ color: 0xff5252, transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide }),
    )
    this.telegraph.rotation.x = -Math.PI / 2
    this.telegraph.position.y = 0.06
    this.telegraph.visible = false
    this.scene.add(this.telegraph)

    this.mesh = buildBossMesh()
    this.mesh.position.set(0, 0, BOSS.bossZ)
    this.scene.add(this.mesh)

    // 단일 발사체 (한 발씩 순차)
    this.bullet = {
      mesh: buildBossBulletMesh(),
      active: false,
      x: 0, y: 1.2, z: 0,
      vx: 0, vz: 0,
    }
    this.scene.add(this.bullet.mesh)
  }

  takeDamage(d) {
    if (!this.alive) return false
    this.hp -= d
    if (this.hp <= 0) {
      this.hp = 0
      this.alive = false
      this.telegraph.visible = false
      this.warningFrames = 0
      this.bullet.active = false
      this.bullet.mesh.visible = false
      return true
    }
    return false
  }

  // 보스도 환경 흐름엔 약하게만 영향(좌우 흔들). 자기 z는 유지.
  update(envSpeed, leaderX, onPlayerHit, leaderZ = 0) {
    const spr = this.mesh.userData.sprite
    if (!this.alive) {
      // 스프라이트 회전 + 추락
      if (spr) spr.material.rotation += 0.06
      this.mesh.position.y -= 0.08
      if (this.mesh.position.y < -3) this.mesh.visible = false
      return
    }

    this.swayPhase += 0.03
    this.mesh.position.x = Math.sin(this.swayPhase) * 1.5
    // 위아래 호흡감
    if (spr) {
      this.mesh.userData.bobPhase = (this.mesh.userData.bobPhase || 0) + 0.05
      spr.position.y = this.mesh.userData.restY + Math.sin(this.mesh.userData.bobPhase) * 0.12
    }

    // 공격 쿨다운
    if (this.warningFrames > 0) {
      this.warningFrames -= 1
      this.telegraph.material.opacity = 0.18 + Math.sin(this.warningFrames * 0.7) ** 2 * 0.25
      if (this.warningFrames === 0) {
        this._fireAtPlayer(this.targetX, this.targetZ)
        this.telegraph.visible = false
      }
    } else if (!this.bullet.active) {
      this.attackTimer -= 1
    }
    if (this.attackTimer <= 0 && !this.bullet.active && this.warningFrames === 0) {
      // 조준 위치를 고정한 뒤 0.6초간 공격 경로를 보여준다.
      this.targetX = leaderX
      this.targetZ = leaderZ
      this.warningFrames = 36
      const sx = this.mesh.position.x, sz = this.mesh.position.z
      this.telegraph.position.set((sx + leaderX) / 2, 0.06, (sz + leaderZ) / 2)
      this.telegraph.rotation.z = -Math.atan2(leaderX - sx, leaderZ - sz)
      this.telegraph.visible = true
      this.attackTimer = BOSS.attackInterval
    }

    // 발사체 갱신
    const b = this.bullet
    if (b.active) {
      b.x += b.vx
      b.z += b.vz + envSpeed * 0.3
      b.mesh.position.set(b.x, b.y, b.z)
      // 학생 leader와 충돌 — 후퇴(leaderZ) 반영
      const dx = b.x - leaderX
      const dz = b.z - leaderZ
      if (dx * dx + dz * dz <= BOSS.bulletHitRadius * BOSS.bulletHitRadius) {
        b.active = false
        b.mesh.visible = false
        onPlayerHit?.(BOSS.bulletDamage)
      } else if (b.z > 12) {
        b.active = false
        b.mesh.visible = false
      }
    }
  }

  _fireAtPlayer(leaderX, leaderZ = 0) {
    const b = this.bullet
    const sx = this.mesh.position.x
    const sz = this.mesh.position.z
    const dx = leaderX - sx
    const dz = leaderZ - sz
    const len = Math.hypot(dx, dz) || 1
    b.x = sx
    b.z = sz
    b.vx = (dx / len) * BOSS.bulletSpeed
    b.vz = (dz / len) * BOSS.bulletSpeed
    b.active = true
    b.mesh.visible = true
    b.mesh.position.set(b.x, b.y, b.z)
  }

  hitTest(bullet) {
    if (!this.alive) return false
    const bx = this.mesh.position.x
    const bz = this.mesh.position.z
    const dx = bullet.x - bx
    const dz = bullet.z - bz
    return dx * dx + dz * dz <= BOSS.hitRadius * BOSS.hitRadius
  }

  dispose() {
    this.scene.remove(this.mesh)
    this.scene.remove(this.bullet.mesh)
    this.scene.remove(this.telegraph)
    this.telegraph.geometry.dispose()
    this.telegraph.material.dispose()
    this.mesh.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => m.dispose())
      }
    })
    this.bullet.mesh.geometry.dispose()
    this.bullet.mesh.material.dispose()
  }
}
