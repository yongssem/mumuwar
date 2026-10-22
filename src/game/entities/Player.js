import * as THREE from 'three'
import { loadCharacterSprite, makeGroundShadow } from '../utils/spriteLoader.js'

// Phase 8.10 — 주인공 픽셀 아트 스프라이트 (idle/celebrate 두 상태)
// 친구보다 살짝 큼 — 적군(2.2)과 동급 또는 약간 큰 정도
const LEADER_SPRITE_SCALE = 1.25  // 월드 ~2.75 단위

export class Player {
  constructor() {
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
    // celebrate 중이면 점프 곡선이 모든 …2141 tokens truncated…L', count: 3 },
        { type: 'ZOMBIE', count: 2 },
      ], hasBoss: true,
        difficulty: { spawnInterval: 0.7, spawnCount: 5, hpMul: 5.0, speedMul: 1.50, eliteRate: 0.50, bossRate: 0.10 } },
}

// 안전 기본값 (구버전 스테이지 데이터 호환)
export const DEFAULT_DIFFICULTY = {
  spawnInterval: 1.0,
  spawnCount: 1,
  hpMul: 1.0,
  speedMul: 1.0,
  eliteRate: 0,
  bossRate: 0,
}

export const STAGE_COUNT = 10

export function getStage(stage) {
  return STAGES[stage] || STAGES[1]
}

export function getTheme(stage) {
  const def = getStage(stage)
  return THEMES[def.theme] || THEMES.ACADEMY
}
