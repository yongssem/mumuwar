import * as THREE from 'three'
import { ROAD_WIDTH, ROAD_LENGTH, PLAYER_SMOOTH, COLORS, GATE_BASE_REWARD, GATE_BASE_PENALTY, getGradeSpeed } from './config.js'
import { Crowd } from './entities/Crowd.js'
import { Player } from './entities/Player.js'
import { GateManager, GATE_COLLISION_PENALTY } from './entities/Gate.js'
import { BurstPool } from './entities/Burst.js'
import { BulletPool } from './entities/Bullet.js'
import { EnemyManager } from './entities/Enemy.js'
import { Boss, BOSS } from './entities/Boss.js'
import { FloatingScorePool } from './entities/FloatingScore.js'
import { getStage, getTheme } from './stages.js'
import { getWeapon, MAX_WEAPON_LV, STREAK_TO_UPGRADE } from './weapons.js'
import { createDragInput } from './input.js'
import { playSfx } from './utils/audio.js'
import { vibrate, HAPTIC } from './utils/haptics.js'

export const PHASE = {
  PLAYING: 'PLAYING',
  BOSS: 'BOSS',
  CLEAR: 'CLEAR',
  GAMEOVER: 'GAMEOVER',
}

// 고정 타임스텝 — 화면 주사율(90/120Hz)과 무관하게 로직은 항상 60Hz
const LOGIC_STEP_MS = 1000 / 60
const MAX_CATCHUP_STEPS = 4

// 콤보/피버 튜닝
const COMBO_WINDOW_FRAMES = 150       // 2.5초 안에 다음 킬 없으면 콤보 끊김 (저학년 스폰 간격 고려)
const COMBO_MAX_MULT_STACK = 20       // 배율에 반영되는 콤보 상한 (1 + 20×0.1 = ×3)
const FEVER_TRIGGER_COMBO = 10
const FEVER_FRAMES = 300              // 5초
const FEVER_COOLDOWN_FRAMES = 420     // 피버 종료 후 7초간 재발동 불가
const COUNTDOWN_FRAMES = 180          // 3-2-1 각 1초

export class Engine {
  constructor(canvas, {
    grade = 3,
    stage = 1,
    nickname = '',
    onFirstInput,
    onCountChange,
    onScoreChange,
    onPhaseChange,
    onBossHpChange,
    onGateAnswer,
    onWeaponChange,
    onStreakChange,
    onTimeChange,
    onComboChange,
    onFeverChange,
    onCountdownChange,
  } = {}) {
    this.canvas = canvas
    this.grade = grade
    this.stage = stage
    this.nickname = nickname
    this.stageDef = getStage(stage)
    this.onCountChange = onCountChange
    this.onScoreChange = onScoreChange
    this.onPhaseChange = onPhaseChange
    this.onBossHpChange = onBossHpChange
    this.onGateAnswer = onGateAnswer
    this.onWeaponChange = onWeaponChange
    this.onStreakChange = onStreakChange
    this.onTimeChange = onTimeChange
    this.onComboChange = onComboChange
    this.onFeverChange = onFeverChange
    this.onCountdownChange = onCountdownChange
    this.score = 0
    this.fireCooldown = 0
    this.phase = PHASE.PLAYING
    this.boss = null
    this.clearDelay = 0
    this.weaponLv = 1
    this.streak = 0
    this.shake = 0
    this.elapsedFrames = 0
    this.timeUp = false
    // 콤보/피버
    this.combo = 0
    this.comboTimer = 0
    this.feverFrames = 0
    this.feverCooldown = 0
    // 시작 카운트다운 (3-2-1-GO)
    this.countdown = COUNTDOWN_FRAMES
    this._lastCountdownSec = -1
    this._lastTickSec = -1
    // 고정 타임스텝 누산기
    this._lastTime = 0
    this._acc = 0
    this.state = { speed: getGradeSpeed(grade), targetX: 0, currentX: 0, targetZ: 0, currentZ: 0 }
    this.dashes = []
    this.trees = []
    this.running = false
    this.paused = false

    this._initRenderer()
    this._initScene()
    this._initLights()
    this._initRoad()
    this._initCrowd()
    this._initPlayer()
    this._initTrees()
    this.applyStageTheme()
    this.gates = new GateManager(this.scene, { grade, stage })
    this.bursts = new BurstPool(this.scene)
    this.bullets = new BulletPool(this.scene)
    this.enemies = new EnemyManager(this.scene, {
      spawnList: this.stageDef.enemies,
      difficulty: this.stageDef.difficulty,
    })
    this.floaters = new FloatingScorePool(this.scene)

    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)
    this._teardownInput = createDragInput(canvas, this.state, onFirstInput)

    // HUD 초기값 즉시 동기화 — React 기본값(스테일)이 첫 이벤트까지 노출되는 버그 방지
    this.onCountChange?.(this.crowd.count)
    this.onTimeChange?.(this.stageDef.duration, this.stageDef.duration)
  }

  _initRenderer() {
    // Phase 8.15: 캔버스 알파 채널 활성화 — CSS 배경 이미지가 비치도록
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000, 0) // 완전 투명
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }

  _initScene() {
    this.scene = new THREE.Scene()
    // Phase 8.15: scene.background = null — CSS 배경 이미지가 보이도록
    this.scene.background = null
    // 안개는 유지: 멀리 가는 적/게이트가 배경으로 자연스럽게 페이드.
    //  · 색은 학원가 야경 톤(다크 인디고) 고정 — 단일 bg 이미지에 맞춤
    this.scene.fog = new THREE.Fog(0x1A1840, 25, 50)

    // §10-6
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)
    this.camera.position.set(0, 9, 11)
    this.camera.lookAt(0, 0, -3)
  }

  _initLights() {
    // Phase 8.12: 어둡되 캐릭터/게이트 가독성 강화 (0.75 → 0.95)
    this.scene.add(new THREE.AmbientLight(0xC5CAE9, 0.95))
    const sun = new THREE.DirectionalLight(0xE8EAF6, 1.05)
    sun.position.set(10, 20, 10)
    sun.castShadow = true
    sun.shadow.mapSize.width = 1024
    sun.shadow.mapSize.height = 1024
    sun.shadow.camera.left = -20
    sun.shadow.camera.right = 20
    sun.shadow.camera.top = 20
    sun.shadow.camera.bottom = -20
    this.scene.add(sun)
    // 캐릭터 위쪽 보조등 (살색/옷 톤 살리기)
    const keyFill = new THREE.PointLight(0xFFE0B2, 0.55, 18)
    keyFill.position.set(0, 6, 4)
    this.scene.add(keyFill)
    // 시안 분위기등 — 게이트/총알 강조
    const cyanFill = new THREE.PointLight(0x00BCD4, 0.5, 30)
    cyanFill.position.set(0, 8, -10)
    this.scene.add(cyanFill)

    // Phase 8.8: 길 위쪽으로 골드 톤 "가로등" 라인 — 도로만 밝히고
    // 풀밭/숲은 다크 톤 유지. 멀리서 오는 적의 윤곽이 잡힘.
    this.pathLights = []
    for (let z = 0; z >= -90; z -= 18) {
      const light = new THREE.PointLight(0xFFD180, 0.85, 16, 1.6)
      light.position.set(0, 6, z)
      this.scene.add(light)
      this.pathLights.push(light)
    }
  }

  _initRoad() {
    // Phase 8.8: 도로 자체 발광 강화 — 멀리까지 길이 보이도록
    this.road = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH),
      new THREE.MeshStandardMaterial({
        color: COLORS.road,
        emissive: COLORS.roadEmissive,
        emissiveIntensity: 0.45,
        roughness: 0.7,
      }),
    )
    this.road.rotation.x = -Math.PI / 2
    this.road.receiveShadow = true
    this.scene.add(this.road)

    this.grass = new THREE.Mesh(
      new THREE.PlaneGeometry(40, ROAD_LENGTH),
      new THREE.MeshStandardMaterial({ color: COLORS.grass, roughness: 1 }),
    )
    this.grass.rotation.x = -Math.PI / 2
    this.grass.position.y = -0.01
    this.grass.receiveShadow = true
    this.scene.add(this.grass)

    // Phase 8.8: 차선 발광 — 길 라인이 어둠 속에서 빛남
    const dashGeo = new THREE.PlaneGeometry(0.2, 1.5)
    const dashMat = new THREE.MeshStandardMaterial({
      color: COLORS.laneDash,
      emissive: COLORS.laneDash,
      emissiveIntensity: 0.9,
    })
    for (let i = -90; i < 90; i += 4) {
      const dash = new THREE.Mesh(dashGeo, dashMat)
      dash.rotation.x = -Math.PI / 2
      dash.position.set(0, 0.01, i)
      this.scene.add(dash)
      this.dashes.push(dash)
    }
  }

  _initCrowd() {
    // Phase 8.12: 친구 빌보드 픽셀아트 → camera 필요
    this.crowd = new Crowd(this.camera)
    this.scene.add(this.crowd.group)
  }

  _initPlayer() {
    this.player = new Player(this.nickname || '용쌤')
    this.scene.add(this.player.group)
  }

  applyStageTheme() {
    const t = getTheme(this.stage)
    // Phase 8.15: scene.background는 CSS가 처리 — 여기서 갱신하지 않음
    // fog 색도 단일 bg 이미지에 맞춰 고정 (near/far만 테마 반영)
    if (this.scene.fog) {
      this.scene.fog.near = t.fogNear
      this.scene.fog.far = t.fogFar
    }
    this.road?.material?.color.set(t.road)
    this.grass?.material?.color.set(t.grass)
  }

  _initTrees() {
    // Phase 8.7: 다크 퍼플 기둥 + 시안 발광 잎 (야간 숲 톤)
    const trunkMat = new THREE.MeshStandardMaterial({
      color: COLORS.trunk,
      emissive: COLORS.trunk,
      emissiveIntensity: 0.15,
      roughness: 0.7,
    })
    const leafMat = new THREE.MeshStandardMaterial({
      color: COLORS.leaf,
      emissive: COLORS.leafEmissive,
      emissiveIntensity: 0.35,
      roughness: 0.5,
    })
    for (let i = 0; i < 30; i++) {
      const tree = new THREE.Group()
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 1, 8),
        trunkMat,
      )
      trunk.position.y = 0.5
      trunk.castShadow = true
      tree.add(trunk)

      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 1.8, 8),
        leafMat,
      )
      leaf.position.y = 1.9
      leaf.castShadow = true
      tree.add(leaf)

      const side = Math.random() > 0.5 ? 1 : -1
      tree.position.set(
        side * (ROAD_WIDTH / 2 + 2 + Math.random() * 8),
        0,
        -i * 8 - Math.random() * 4,
      )
      this.scene.add(tree)
      this.trees.push(tree)
    }
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  _tick = (now = 0) => {
    if (!this.running) return
    this._rafId = requestAnimationFrame(this._tick)

    // 일시정지 — 게임 로직은 멈추되 정적 프레임은 계속 렌더
    if (this.paused) {
      this._lastTime = now // 재개 시 dt 스파이크 방지
      this.renderer.render(this.scene, this.camera)
      return
    }

    // 고정 타임스텝 — 90/120Hz 기기에서도 게임 속도 동일
    if (!this._lastTime) this._lastTime = now
    let dt = now - this._lastTime
    this._lastTime = now
    if (dt > 250) dt = 250 // 탭 전환 복귀 시 폭주 방지
    this._acc += dt
    let steps = 0
    while (this._acc >= LOGIC_STEP_MS && steps < MAX_CATCHUP_STEPS) {
      this._step()
      this._acc -= LOGIC_STEP_MS
      steps += 1
    }
    if (steps === MAX_CATCHUP_STEPS) this._acc = 0 // 못 따라잡으면 슬로우모션 대신 버림

    this.renderer.render(this.scene, this.camera)
  }

  // 60Hz 논리 1스텝
  _step() {
    // Phase 8.14.2: targetZ 자동 감쇠 제거 — 의도적 후퇴는 유지돼야 함.
    //  · 누적 버그는 input.js의 축 필터 + 최소 임계로 차단.

    this.state.currentX += (this.state.targetX - this.state.currentX) * PLAYER_SMOOTH
    this.state.currentZ += (this.state.targetZ - this.state.currentZ) * PLAYER_SMOOTH
    // Phase 8.6: 후퇴 중 판정 — z>0이거나 후퇴 입력 진행 중
    const isRetreating = this.state.currentZ > 0.05 || (this.state.targetZ - this.state.currentZ) > 0.01
    this.player.setX(this.state.currentX)
    this.player.setZ(this.state.currentZ)
    this.player.update(isRetreating)
    this.crowd.update(this.state.currentX, this.state.currentZ, isRetreating)

    // 시작 카운트다운 — 3·2·1·GO 동안 이동/조준만 가능, 나머지 로직 정지
    if (this.countdown > 0) {
      const sec = Math.ceil(this.countdown / 60)
      if (sec !== this._lastCountdownSec) {
        this._lastCountdownSec = sec
        this.onCountdownChange?.(sec)
        playSfx('count')
      }
      this.countdown -= 1
      if (this.countdown === 0) {
        this.onCountdownChange?.(0) // 0 = GO!
        playSfx('go')
        vibrate(HAPTIC.go)
      }
      this._updateCamera()
      return
    }

    // 콤보 타이머 — 시간 안에 킬 못 이으면 끊김
    if (this.comboTimer > 0) {
      this.comboTimer -= 1
      if (this.comboTimer === 0 && this.combo > 0) {
        this.combo = 0
        this.onComboChange?.(0, 1)
      }
    }
    // 피버 타이머
    if (this.feverFrames > 0) {
      this.feverFrames -= 1
      if (this.feverFrames === 0) {
        this.feverCooldown = FEVER_COOLDOWN_FRAMES
        this.onFeverChange?.(false)
      }
    } else if (this.feverCooldown > 0) {
      this.feverCooldown -= 1
    }

    // 시간 카운트 (게임플레이 진행 중에만)
    if (this.phase === PHASE.PLAYING) {
      this.elapsedFrames += 1
      const elapsedSec = this.elapsedFrames / 60
      if (this.elapsedFrames === 1 || this.elapsedFrames % 30 === 0) {
        const remain = Math.max(0, Math.ceil(this.stageDef.duration - elapsedSec))
        this.onTimeChange?.(remain, this.stageDef.duration)
        // 막판 5초 카운트 사운드 (초당 1회)
        if (remain <= 5 && remain > 0 && remain !== this._lastTickSec) {
          this._lastTickSec = remain
          playSfx('tick')
        }
      }
      if (!this.timeUp && elapsedSec >= this.stageDef.duration) {
        this.timeUp = true
        this.enemies.stopSpawning()
        if (this.stageDef.hasBoss) {
          this._spawnBoss()
        }
      }
    }

    // 시간 다 됐고 보스 없는 스테이지 → 남은 적 처치되면 CLEAR
    if (this.timeUp && !this.stageDef.hasBoss && this.enemies.finished() && this.clearDelay === 0) {
      this.clearDelay = 60
    }

    // §3 게이트 — 사격은 별도 루프에서, 여기선 통과/충돌 판정만
    if (this.phase === PHASE.PLAYING) {
      this.gates.update(this.state.speed, this.state.currentX, {
        onPass: (r) => this._handleGatePass(r),
        onCollide: (r) => this._handleGateCollide(r),
      }, this.state.currentZ)
    }
    this.bursts.update(this.state.speed)

    // 적 갱신 — 군단 충돌 시 친구 차감
    if (this.phase === PHASE.PLAYING || this.phase === PHASE.BOSS) {
      this.enemies.update(this.state.speed, this.state.currentX, (enemy) => {
        // collision callback

        const after = Math.max(0, this.crowd.count - enemy.type.collisionDamage)
        this.crowd.setCount(after)
        this.bursts.spawn(enemy.mesh.position.clone(), 0xff0000)
        vibrate(HAPTIC.crowdHit)
        this.onCountChange?.(after)
        if (after <= 0) this._setPhase(PHASE.GAMEOVER)
      }, this.state.currentZ)
    }
    this.floaters.update(this.state.speed)

    // 보스 갱신 — 후퇴(currentZ) 반영해 발사체 판정
    if (this.boss) {
      this.boss.update(this.state.speed, this.state.currentX, (damage) => {
        const after = Math.max(0, this.crowd.count - damage)
        this.crowd.setCount(after)
        this.onCountChange?.(after)
        this.bursts.spawn(this.crowd.group.position.clone().setX(this.state.currentX), 0xff0000)
        vibrate(HAPTIC.crowdHit)
        if (after <= 0) this._setPhase(PHASE.GAMEOVER)
      }, this.state.currentZ)
      this.onBossHpChange?.(this.boss.hp, BOSS.maxHp)
    }

    // v2.3.1 §8.0.5 자동 사격 — 다발 분산: 군단의 20%가 각자 위치에서 동시 발사
    const canFire = (this.phase === PHASE.PLAYING || this.phase === PHASE.BOSS) && this.crowd.count > 0
    this.fireCooldown -= 1
    if (canFire && this.fireCooldown <= 0) {
      const w = getWeapon(this.weaponLv)
      // crowd.count = 친구 수. 리더 포함 총원 = count + 1
      const totalCrowd = this.crowd.count + 1
      // 무기 shots 스탯 = 최소 동시 발사 수 — 레벨업하면 확실히 화력이 늘어난 게 보임
      const shooterCount = Math.max(w.shots, Math.min(30, Math.floor(totalCrowd * 0.2)))
      // 총 DPS 유지: 데미지를 사격자 수로 분산
      const totalDamage = Math.max(1, Math.round(w.damage * Math.sqrt(totalCrowd)))
      const perBulletDamage = Math.max(1, Math.round(totalDamage / shooterCount))
      const SPREAD_ANGLE = 0.075 // ±0.075 라디안 (≈4도)
      const shooters = this.crowd.pickRandomMembers(shooterCount, this.state.currentX, this.state.currentZ)
      for (const s of shooters) {
        const vx = (Math.random() - 0.5) * 2 * SPREAD_ANGLE * 1.4 // 진행속도(1.4)에 비례한 x속도
        this.bullets.spawn(s.x, s.z, perBulletDamage, vx, 1.0)
        this.bullets.flashMuzzleAt(s.x, 1.5, s.z)
      }
      // 피버 중엔 발사 속도 2배
      this.fireCooldown = this.feverFrames > 0 ? Math.max(4, Math.round(w.cooldown / 2)) : w.cooldown
      playSfx('shoot')
    }

    this.bullets.update(this.state.speed, (b) => {
      const result = this.enemies.checkBulletHit(b)
      if (result?.killed) {
        const enemy = result.enemy
        // 콤보 갱신 — 1.5초 안에 킬을 이으면 배율 상승
        this._onEnemyKill()
        const comboMult = 1 + Math.min(this.combo, COMBO_MAX_MULT_STACK) * 0.1
        const feverMult = this.feverFrames > 0 ? 2 : 1
        // Phase 9.0: enemy.score 는 변종 배수 반영된 최종값 + 콤보/피버 배율
        const earned = Math.round((enemy.score ?? enemy.type.score) * comboMult * feverMult)
        this.score += earned
        // 변종일수록 더 화려한 폭발 (basic 1.6, elite 2.0, boss 2.6)
        const burstSize = enemy.variant === 'boss' ? 2.6 : enemy.variant === 'elite' ? 2.0 : 1.6
        const burstParticles = enemy.variant === 'boss' ? 22 : enemy.variant === 'elite' ? 16 : 12
        this.bursts.spawn(enemy.mesh.position.clone(), enemy.type.color, burstSize, burstParticles)
        this.bursts.spawnFlash(enemy.mesh.position.clone(), 1.4)
        const scoreColor = feverMult > 1 ? '#FF6EC7' : '#FFD700'
        this.floaters.spawn(enemy.mesh.position.clone(), `+${earned}`, scoreColor, 2)
        playSfx('kill')
        this.onScoreChange?.(this.score)
        return true
      }
      if (result?.hit) return true

      // 게이트 명중
      const gateResult = this.gates.checkBulletHit(b)
      if (gateResult?.broken) {
        const g = gateResult.gate
        // Phase 8.5: 30개 파편 + 시안 충격파 + 흔들림 20
        const isCorrect = g.userData.isCorrect
        const burstColor = isCorrect ? 0x00FFFF : 0xE53935
        const center = g.position.clone().setY(1.8)
        this.bursts.spawn(center, burstColor, 2.4, 30)
        this.bursts.spawnFlash(center, 2.2)
        this.bursts.spawnShockwave(g.position.clone(), burstColor, 4, 40)
        this.shake = Math.max(this.shake, 20)
        g.visible = false
        return true
      }
      if (gateResult?.hit) {
        // Phase 8.5: 명중 파편 5개 (작은 시안 폭발)
        this.bursts.spawn(
          new THREE.Vector3(b.x, b.y, gateResult.gate.position.z),
          0x00B4FF, 0.4, 5,
        )
        return true
      }
      if (this.boss && this.boss.hitTest(b)) {
        const killed = this.boss.takeDamage(b.damage)
        this.score += Math.floor(b.damage / 5)
        this.onScoreChange?.(this.score)
        if (killed) {
          this.bursts.spawn(this.boss.mesh.position.clone(), 0xFFD600)
          this.floaters.spawn(this.boss.mesh.position.clone(), '+500', '#FFD600')
          playSfx('bossDie')
          vibrate(HAPTIC.bossDie)
          this.score += 500
          this.onScoreChange?.(this.score)
          this.player?.triggerCelebrate(1000)
          this.clearDelay = 90
        }
        return true
      }
      return false
    })

    // 보스 격파 후 잠시 폭죽 후 CLEAR
    if (this.clearDelay > 0) {
      this.clearDelay -= 1
      if (this.clearDelay === 0) this._setPhase(PHASE.CLEAR)
    }

    for (const tree of this.trees) {
      tree.position.z += this.state.speed
      if (tree.position.z > 15) {
        tree.position.z -= 250
        const side = Math.random() > 0.5 ? 1 : -1
        tree.position.x = side * (ROAD_WIDTH / 2 + 2 + Math.random() * 8)
      }
    }

    for (const dash of this.dashes) {
      dash.position.z += this.state.speed
      if (dash.position.z > 10) dash.position.z -= 184
    }

    this._updateCamera()
  }

  _updateCamera() {
    this.camera.position.x += (this.state.currentX * 0.25 - this.camera.position.x) * 0.1
    // Phase 8.6: 카메라가 플레이어 z의 30%만 따라가 게이트 시야 유지
    const targetCamZ = 11 + this.state.currentZ * 0.3
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.1

    // 충돌 시 화면 흔들림 (§3-3)
    let shakeY = 0
    if (this.shake > 0) {
      const amp = (this.shake / 14) * 0.4
      this.camera.position.x += (Math.random() - 0.5) * amp
      shakeY = (Math.random() - 0.5) * amp
      this.shake -= 1
    }
    this.camera.lookAt(this.state.currentX * 0.25, shakeY, -3)
  }

  // 적 처치 → 콤보 스택 + 피버 발동 판정
  _onEnemyKill() {
    this.combo += 1
    this.comboTimer = COMBO_WINDOW_FRAMES
    const comboMult = 1 + Math.min(this.combo, COMBO_MAX_MULT_STACK) * 0.1
    this.onComboChange?.(this.combo, comboMult)
    // 5콤보 단위 마일스톤 사운드
    if (this.combo >= 5 && this.combo % 5 === 0) playSfx('combo')
    // 피버 발동
    if (this.combo >= FEVER_TRIGGER_COMBO && this.feverFrames <= 0 && this.feverCooldown <= 0) {
      this.feverFrames = FEVER_FRAMES
      this.onFeverChange?.(true)
      playSfx('fever')
      vibrate(HAPTIC.feverStart)
    }
  }

  start() {
    if (this.running) return
    this.running = true
    this._rafId = requestAnimationFrame(this._tick)
  }

  setPaused(paused) {
    this.paused = !!paused
  }

  _spawnBoss() {
    // 남은 게이트 제거 — 얼어붙은 게이트가 보스로 가는 총알을 막는 버그 방지
    this.gates.clearAll()
    this.boss = new Boss(this.scene)
    this._setPhase(PHASE.BOSS)
    this.onBossHpChange?.(this.boss.hp, BOSS.maxHp)
    playSfx('bossWarn')
    vibrate(HAPTIC.bossWarn)
  }

  // §3-3: 깨고 통과 → 효과 발동
  _handleGatePass(r) {
    const delta = r.correct ? GATE_BASE_REWARD : -GATE_BASE_PENALTY
    const before = this.crowd.count
    const after = Math.max(0, before + delta)
    this.crowd.setCount(after)
    this.bursts.spawn(r.position, r.correct ? 0x4CAF50 : 0xE53935, 1, 18)
    // Phase 8.5: +1 다발 + 메가 텍스트
    if (r.correct) {
      this.floaters.spawnBurst(r.position, '+1', '#4CAF50', delta)
      this.floaters.spawnMega(r.position, `+${delta} 💪`, '#FFD600')
    } else {
      this.floaters.spawn(r.position, `${delta}`, '#E53935', 1.2)
    }
    playSfx(r.correct ? 'correct' : 'wrong')
    vibrate(r.correct ? HAPTIC.gateCorrect : HAPTIC.gateWrong)
    if (r.correct) {
      playSfx('recruit')
      this.player?.triggerCelebrate(600)
    }
    this.onCountChange?.(this.crowd.count)
    this.onGateAnswer?.({ ...r, kind: 'pass' })

    // 정답 게이트를 깬 경우만 streak (§5-2)
    if (r.correct) {
      this.streak += 1
      if (this.streak >= STREAK_TO_UPGRADE && this.weaponLv < MAX_WEAPON_LV) {
        this.weaponLv += 1
        this.streak = 0
        const w = getWeapon(this.weaponLv)
        this.bullets.setWeaponLevel(this.weaponLv)
        this.bursts.spawn(r.position, w.color)
        this.onWeaponChange?.(this.weaponLv)
      }
    } else {
      this.streak = 0
    }
    this.onStreakChange?.(this.streak)

    // v2.3 §8.0-A: 게이트 통과 직후 0.5초 후 강제 웨이브
    this.enemies.scheduleWave(30)

    if (this.crowd.count <= 0) this._setPhase(PHASE.GAMEOVER)
  }

  // §3-3: HP 남은 채 충돌 → 친구 -10 + 화면 흔들림
  _handleGateCollide(r) {
    const before = this.crowd.count
    const after = Math.max(0, before - GATE_COLLISION_PENALTY)
    this.crowd.setCount(after)
    this.bursts.spawn(r.position, 0xff3030)
    this.floaters.spawn(r.position, `-${GATE_COLLISION_PENALTY}`, '#E53935')
    playSfx('wrong')
    vibrate(HAPTIC.gateWrong)
    this.shake = 14   // 14프레임 흔들림
    this.onCountChange?.(this.crowd.count)
    this.onGateAnswer?.({ ...r, kind: 'collide' })

    this.streak = 0
    this.onStreakChange?.(this.streak)

    this.enemies.scheduleWave(30)

    if (this.crowd.count <= 0) this._setPhase(PHASE.GAMEOVER)
  }

  _setPhase(p) {
    if (this.phase === p) return
    this.phase = p
    // Phase 8.10: 클리어 시 주인공이 점프하며 환호
    if (p === PHASE.CLEAR) this.player?.triggerCelebrate(1500)
    this.onPhaseChange?.(p, { score: this.score, crowd: this.crowd.count })
  }

  dispose() {
    this.running = false
    if (this._rafId) cancelAnimationFrame(this._rafId)
    window.removeEventListener('resize', this._onResize)
    this._teardownInput?.()
    this.floaters?.dispose() // spawnBurst 지연 타이머가 죽은 씬에 스폰하는 것 차단
    this.renderer.dispose()
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => m.dispose())
      }
    })
  }
}
