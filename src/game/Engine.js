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
    this.state = { speed: getGradeSpeed(grade), targetX: 0, currentX: 0 }
    this.dashes = []
    this.trees = []
    this.running = false

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
    this.scene.fog = new THREE.Fog(COLORS.sky, 30, 80)

    // §10-6
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)
    this.camera.position.set(0, 9, 11)
    this.camera.lookAt(0, 0, -3)
  }

  _initLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const sun = new THREE.DirectionalLight(0xffffff, 0.8)
    sun.position.set(10, 20, 10)
    sun.castShadow = true
    sun.shadow.mapSize.width = 1024
    sun.shadow.mapSize.height = 1024
    sun.shadow.camera.left = -20
    sun.shadow.camera.right = 20
    sun.shadow.camera.top = 20
    sun.shadow.camera.bottom = -20
    this.scene.add(sun)
  }

  _initRoad() {
    this.road = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH),
      new THREE.MeshStandardMaterial({ color: COLORS.road }),
    )
    this.road.rotation.x = -Math.PI / 2
    this.road.receiveShadow = true
    this.scene.add(this.road)

    this.grass = new THREE.Mesh(
      new THREE.PlaneGeometry(40, ROAD_LENGTH),
      new THREE.MeshStandardMaterial({ color: COLORS.grass }),
    )
    this.grass.rotation.x = -Math.PI / 2
    this.grass.position.y = -0.01
    this.grass.receiveShadow = true
    this.scene.add(this.grass)

    const dashGeo = new THREE.PlaneGeometry(0.2, 1.5)
    const dashMat = new THREE.MeshStandardMaterial({ color: COLORS.laneDash })
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
    this.player = new Player()
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
    for (let i = 0; i < 30; i++) {
      const tree = new THREE.Group()
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 1, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.trunk }),
      )
      trunk.position.y = 0.5
      trunk.castShadow = true
      tree.add(trunk)

      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 1.8, 8),
        new THREE.MeshStandardMaterial({ color: COLORS.leaf }),
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

    this.state.currentX += (this.state.targetX - this.state.currentX) * PLAYER_SMOOTH
    this.player.setX(this.state.currentX)
    this.player.update()
    this.crowd.update(this.state.currentX)

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
      })
    }
    this.bursts.update(this.state.speed)

    // 적 갱신 — 군단 충돌 시 친구 차감
    if (this.phase === PHASE.PLAYING || this.phase === PHASE.BOSS) {
      this.enemies.update(this.state.speed, this.state.currentX, (enemy) => {
        const after = Math.max(0, this.crowd.count - enemy.type.collisionDamage)
        this.crowd.setCount(after)
        this.bursts.spawn(enemy.mesh.position.clone(), 0xff0000)
        this.onCountChange?.(after)
        if (after <= 0) this._setPhase(PHASE.GAMEOVER)
      })
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
      const shooters = this.crowd.pickRandomMembers(shooterCount, this.state.currentX)
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
        this.bursts.spawn(enemy.mesh.position.clone(), enemy.type.color, 1.5)
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
        // 큰 노란 burst (게이트 깨짐)
        this.bursts.spawn(g.position.clone().setY(1.5), 0xFFD600, 2.0)
        this.bursts.spawn(g.position.clone().setY(1.5), 0xFFFFFF, 1.5)
        g.visible = false
        return true
      }
      if (gateResult?.hit) {
        // 작은 파편 (15% 확률로만 — 너무 자주면 시각 노이즈)
        if (Math.random() < 0.15) {
          this.bursts.spawn(
            new THREE.Vector3(b.x, b.y, gateResult.gate.position.z),
            0xFFEB3B, 0.5,
          )
        }
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
    this.bursts.spawn(r.position, r.correct ? 0x4CAF50 : 0xE53935)
    this.floaters.spawn(r.position, (delta >= 0 ? `+${delta}` : `${delta}`), r.correct ? '#4CAF50' : '#E53935')
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
