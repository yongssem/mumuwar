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

export const PHASE = {
  PLAYING: 'PLAYING',
  BOSS: 'BOSS',
  CLEAR: 'CLEAR',
  GAMEOVER: 'GAMEOVER',
}

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
    this.enemies = new EnemyManager(this.scene, { spawnList: this.stageDef.enemies })
    this.floaters = new FloatingScorePool(this.scene)

    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)
    this._teardownInput = createDragInput(canvas, this.state, onFirstInput)
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }

  _initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(COLORS.sky)
    // Phase 8.7: 다크 톤 — fog 가까이 (15→60) 깊이감 + 윤곽 사라짐 효과
    this.scene.fog = new THREE.Fog(COLORS.sky, 15, 60)

    // §10-6
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)
    this.camera.position.set(0, 9, 11)
    this.camera.lookAt(0, 0, -3)
  }

  _initLights() {
    // Phase 8.7: 다크 톤 유지하면서 캐릭터 가독성 확보
    this.scene.add(new THREE.AmbientLight(0xC5CAE9, 0.75))
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
    this.crowd = new Crowd()
    this.scene.add(this.crowd.group)
  }

  _initPlayer() {
    this.player = new Player(this.nickname || '용쌤')
    this.scene.add(this.player.group)
  }

  applyStageTheme() {
    const t = getTheme(this.stage)
    if (this.scene.background?.set) this.scene.background.set(t.bg)
    else this.scene.background = new THREE.Color(t.bg)
    if (this.scene.fog) {
      this.scene.fog.color.set(t.bg)
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

  _tick = () => {
    if (!this.running) return
    this._rafId = requestAnimationFrame(this._tick)

    // 일시정지 — 게임 로직은 멈추되 정적 프레임은 계속 렌더
    if (this.paused) {
      this.renderer.render(this.scene, this.camera)
      return
    }

    this.state.currentX += (this.state.targetX - this.state.currentX) * PLAYER_SMOOTH
    this.state.currentZ += (this.state.targetZ - this.state.currentZ) * PLAYER_SMOOTH
    // Phase 8.6: 후퇴 중 판정 — z>0이거나 후퇴 입력 진행 중
    const isRetreating = this.state.currentZ > 0.05 || (this.state.targetZ - this.state.currentZ) > 0.01
    this.player.setX(this.state.currentX)
    this.player.setZ(this.state.currentZ)
    this.player.update(isRetreating)
    this.crowd.update(this.state.currentX, this.state.currentZ, isRetreating)

    // 시간 카운트 (게임플레이 진행 중에만)
    if (this.phase === PHASE.PLAYING) {
      this.elapsedFrames += 1
      const elapsedSec = this.elapsedFrames / 60
      if (this.elapsedFrames % 30 === 0) {
        const remain = Math.max(0, Math.ceil(this.stageDef.duration - elapsedSec))
        this.onTimeChange?.(remain, this.stageDef.duration)
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
        this.onCountChange?.(after)
        if (after <= 0) this._setPhase(PHASE.GAMEOVER)
      }, this.state.currentZ)
    }
    this.floaters.update(this.state.speed)

    // 보스 갱신
    if (this.boss) {
      this.boss.update(this.state.speed, this.state.currentX, (damage) => {
        const after = Math.max(0, this.crowd.count - damage)
        this.crowd.setCount(after)
        this.onCountChange?.(after)
        this.bursts.spawn(this.crowd.group.position.clone().setX(this.state.currentX), 0xff0000)
        if (after <= 0) this._setPhase(PHASE.GAMEOVER)
      })
      this.onBossHpChange?.(this.boss.hp, BOSS.maxHp)
    }

    // v2.3.1 §8.0.5 자동 사격 — 다발 분산: 군단의 20%가 각자 위치에서 동시 발사
    const canFire = (this.phase === PHASE.PLAYING || this.phase === PHASE.BOSS) && this.crowd.count > 0
    this.fireCooldown -= 1
    if (canFire && this.fireCooldown <= 0) {
      const w = getWeapon(this.weaponLv)
      // crowd.count = 친구 수. 리더 포함 총원 = count + 1
      const totalCrowd = this.crowd.count + 1
      const shooterCount = Math.max(1, Math.min(30, Math.floor(totalCrowd * 0.2)))
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
      this.fireCooldown = w.cooldown
      playSfx('shoot')
    }

    this.bullets.update(this.state.speed, (b) => {
      const result = this.enemies.checkBulletHit(b)
      if (result?.killed) {
        const enemy = result.enemy
        this.score += enemy.type.score
        // Phase 8.5: 파편 12개 + 흰 섬광
        this.bursts.spawn(enemy.mesh.position.clone(), enemy.type.color, 1.6, 12)
        this.bursts.spawnFlash(enemy.mesh.position.clone(), 1.4)
        this.floaters.spawn(enemy.mesh.position.clone(), `+${enemy.type.score}`, '#FFD700', 2)
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
          this.score += 500
          this.onScoreChange?.(this.score)
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

    this.renderer.render(this.scene, this.camera)
  }

  start() {
    if (this.running) return
    this.running = true
    this._tick()
  }

  setPaused(paused) {
    this.paused = !!paused
  }

  _spawnBoss() {
    this.boss = new Boss(this.scene)
    this._setPhase(PHASE.BOSS)
    this.onBossHpChange?.(this.boss.hp, BOSS.maxHp)
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
    if (r.correct) playSfx('recruit')
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
    this.onPhaseChange?.(p, { score: this.score, crowd: this.crowd.count })
  }

  dispose() {
    this.running = false
    if (this._rafId) cancelAnimationFrame(this._rafId)
    window.removeEventListener('resize', this._onResize)
    this._teardownInput?.()
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
