import * as THREE from 'three'
import { loadCharacterSprite, makeGroundShadow } from '../utils/spriteLoader.js'

// Phase 8.10 — 주인공 픽셀 아트 스프라이트 (idle/celebrate 두 상태)
// 친구보다 살짝 큼 — 적군(2.2)과 동급 또는 약간 큰 정도
const LEADER_SPRITE_SCALE = 1.25  // 월드 ~2.75 단위

function makeNameTagSprite(name) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 80
  const ctx = c.getContext('2d')
  // 둥근 흰 배경
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.beginPath()
  const r = 18
  ctx.moveTo(r, 4)
  ctx.lineTo(256 - r, 4)
  ctx.quadraticCurveTo(252, 4, 252, r + 4)
  ctx.lineTo(252, 76 - r)
  ctx.quadraticCurveTo(252, 76, 256 - r, 76)
  ctx.lineTo(r, 76)
  ctx.quadraticCurveTo(4, 76, 4, 76 - r)
  ctx.lineTo(4, r + 4)
  ctx.quadraticCurveTo(4, 4, r, 4)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#4A90E2'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = '#1a1a2e'
  ctx.font = 'bold 36px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, 128, 42)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(1.6, 0.5, 1)
  return sprite
}

export class Player {
  constructor(name = '용쌤') {
    this.group = new THREE.Group()
    this.walkPhase = 0

    // 리더 표식 — 친구와 차별화되는 진한 그림자 (반경 살짝 큼)
    this.shadow = makeGroundShadow(0.75)
    this.shadow.material.opacity = 0.6
    this.group.add(this.shadow)

    // idle 스프라이트 (뒷모습) — 항상 씬에 살아있음
    this.sprite = loadCharacterSprite('leader-yongssam-idle', LEADER_SPRITE_SCALE)
    this.group.add(this.sprite)

    // celebrate 스프라이트는 머티리얼만 미리 로드해두고 swap 방식
    const celebrateSprite = loadCharacterSprite('leader-yongssam-celebrate', LEADER_SPRITE_SCALE)
    this.idleMaterial = this.sprite.material
    this.celebrateMaterial = celebrateSprite.material
    // celebrateSprite의 객체 자체는 버림 (material만 사용)

    this.baseY = this.sprite.userData.restY
    this.spriteHeight = this.sprite.userData.spriteHeight

    // Phase 8.13: 걷기 모션을 위해 기본 스케일 보관 (scale.y 압축/팽창 베이스)
    this.baseScaleX = this.sprite.scale.x
    this.baseScaleY = this.sprite.scale.y

    // 닉네임 태그 — 스프라이트 머리 위
    this.nameTag = makeNameTagSprite(name)
    this.nameTag.position.set(0, this.spriteHeight + 0.35, 0)
    this.group.add(this.nameTag)

    // celebrate 상태
    this.celebrating = false
    this.celebrateStartTime = 0
    this.celebrateDuration = 0
  }

  setX(x) { this.group.position.x = x }
  setZ(z) { this.group.position.z = z }

  /**
   * 정답/보스킬/클리어 시 호출 — celebrate 스프라이트로 잠시 바뀌고 점프.
   * @param {number} duration ms
   */
  triggerCelebrate(duration = 500) {
    this.celebrating = true
    this.celebrateStartTime = performance.now()
    this.celebrateDuration = Math.max(100, duration)
    this.sprite.material = this.celebrateMaterial
    // Phase 8.13: celebrate 직전 걷기 잔여 상태 리셋 (틸트/스트레치)
    this.sprite.scale.set(this.baseScaleX, this.baseScaleY, 1)
    this.celebrateMaterial.rotation = 0
    if (this.shadow) this.shadow.scale.setScalar(1)
  }

  // Phase 8.13 — 걷기 모션:
  //  · y bob   = sin(walkPhase) * 0.08      (위아래 통통)
  //  · 틸트    = sin(walkPhase) * 0.05      (좌우 기울기, material.rotation)
  //  · 세로 stretch = 1 + sin(walkPhase·2) * 0.02 (사뿐사뿐)
  //  · 후퇴/celebrate 중에는 정지
  update(isRetreating = false) {
    // celebrate 중이면 점프 곡선이 모든 기본 모션을 덮어씀
    if (this.celebrating) {
      const elapsed = performance.now() - this.celebrateStartTime
      const t = elapsed / this.celebrateDuration
      if (t < 1) {
        // sin(π·t): 0 → 1 → 0 형태의 점프 호
        this.sprite.position.y = this.baseY + Math.sin(t * Math.PI) * 0.6
        return
      }
      // 종료 — idle 복귀, 걷기 잔여 상태도 리셋
      this.celebrating = false
      this.sprite.position.y = this.baseY
      this.sprite.material = this.idleMaterial
      this.idleMaterial.rotation = 0
      this.sprite.scale.set(this.baseScaleX, this.baseScaleY, 1)
      this.walkPhase = 0
    }

    if (isRetreating) {
      // 후퇴 중: 정지 자세
      this.sprite.position.y = this.baseY
      this.sprite.material.rotation = 0
      this.sprite.scale.set(this.baseScaleX, this.baseScaleY, 1)
      this.shadow.scale.setScalar(1)
      return
    }

    // 평소 걷기 — 한 걸음 ≈ 0.35초 (walkPhase += 0.18 @60fps)
    this.walkPhase += 0.18
    const w = this.walkPhase
    const walkY = Math.sin(w) * 0.08
    const tilt = Math.sin(w) * 0.05
    const stretch = Math.sin(w * 2) * 0.02

    this.sprite.position.y = this.baseY + walkY
    this.sprite.material.rotation = tilt
    this.sprite.scale.set(this.baseScaleX, this.baseScaleY * (1 + stretch), 1)

    // 그림자: 떠올랐을 때만 살짝 작아짐 (양수 heightRatio만 적용)
    const heightRatio = Math.max(0, walkY / 0.08)
    this.shadow.scale.setScalar(1.0 - heightRatio * 0.05)
  }
}
