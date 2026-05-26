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
  }

  // Phase 8.6: 후퇴 중에는 걷기 애니메이션 정지
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
      // 종료 — idle 복귀
      this.celebrating = false
      this.sprite.position.y = this.baseY
      this.sprite.material = this.idleMaterial
    }

    if (isRetreating) {
      // 후퇴 중: 호흡 정지, 정적
      this.sprite.position.y = this.baseY
      return
    }

    // 걷기 호흡 — 가벼운 sin bob
    this.walkPhase += 0.25
    this.sprite.position.y = this.baseY + Math.abs(Math.sin(this.walkPhase)) * 0.08
  }
}
