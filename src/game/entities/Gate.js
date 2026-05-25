import * as THREE from 'three'
import {
  ROAD_WIDTH,
  GATE_COLOR,
  GATE_BASE_REWARD,
  GATE_BASE_PENALTY,
} from '../config.js'
import { generateProblem } from '../utils/problems.js'

// GAME_DESIGN v2.2 §3 — HP 장벽 게이트
//  · 정답 게이트 HP 100 (얇은 유리)
//  · 오답 게이트 HP 500 (방탄유리)
//  · 군단이 자동 사격으로 깨고, 깨면 효과 / 못 깨면 충돌 페널티 -10

// v2.2.1 — HP 하향
export const GATE_CORRECT_HP = 40
export const GATE_WRONG_HP   = 200
export const GATE_COLLISION_PENALTY = 10

const GATE_WIDTH = ROAD_WIDTH / 2 - 0.1
const GATE_HEIGHT = 4.0   // Phase 8.5: 3 → 4 (압도감)
const GATE_THICKNESS = 0.2
const FRAME_THICKNESS = 0.22

const PROBLEM_PANEL_WIDTH = ROAD_WIDTH * 0.95
const PROBLEM_PANEL_HEIGHT = 1.4

// HP 바: 가로 게이트 폭 거의 다 + 두꺼움 + 텍스트
const HP_BAR_WIDTH = GATE_WIDTH * 0.98
const HP_BAR_HEIGHT = 0.5
const HP_CANVAS_W = 512
const HP_CANVAS_H = 96

function makeAnswerTexture(text) {
  // Phase 8.5: 투명 배경 + 흰 글씨 + 다크 외곽선 (게이트 패널이 배경 역할)
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, 512, 256)
  ctx.font = 'bold 200px "JetBrains Mono", "Pretendard", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // 두꺼운 다크 외곽선
  ctx.lineWidth = 16
  ctx.strokeStyle = '#0D1B2A'
  ctx.lineJoin = 'round'
  ctx.strokeText(text, 256, 130)
  // 흰 본문
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(text, 256, 130)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

function makeProblemTexture(question) {
  // Phase 8.5: 다크 글래스 + 골드 테두리 (Hades 톤)
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 256
  const ctx = c.getContext('2d')
  // 다크 반투명 배경
  ctx.fillStyle = 'rgba(15, 14, 26, 0.92)'
  ctx.fillRect(0, 0, 1024, 256)
  // 골드 테두리 (이중)
  ctx.strokeStyle = '#FFC107'
  ctx.lineWidth = 5
  ctx.strokeRect(6, 6, 1012, 244)
  ctx.strokeStyle = 'rgba(255,193,7,0.4)'
  ctx.lineWidth = 2
  ctx.strokeRect(14, 14, 996, 228)
  // 골드 텍스트
  ctx.font = 'bold 120px "JetBrains Mono", "Pretendard", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(255,214,0,0.7)'
  ctx.shadowBlur = 20
  ctx.fillStyle = '#FFD600'
  ctx.fillText(question, 512, 128)
  ctx.shadowBlur = 0
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

// CanvasTexture로 HP 바 한 장에 통째로 — 배경+윤곽선+fill+텍스트
function drawHpBar(ctx, hp, maxHp) {
  const W = HP_CANVAS_W, H = HP_CANVAS_H
  ctx.clearRect(0, 0, W, H)
  // 검정 반투명 배경
  ctx.fillStyle = 'rgba(0,0,0,0.65)'
  ctx.fillRect(0, 0, W, H)
  // fill (녹 → 노 → 빨)
  const ratio = Math.max(0, hp / maxHp)
  const r = ratio < 0.5 ? 255 : Math.round((1 - ratio) * 2 * 255)
  const g = ratio > 0.5 ? 200 : Math.round(ratio * 2 * 200)
  ctx.fillStyle = `rgb(${r}, ${g}, 60)`
  ctx.fillRect(6, 6, (W - 12) * ratio, H - 12)
  // 흰 윤곽선
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, W - 4, H - 4)
  // 텍스트 "현재/최대"
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = 'rgba(0,0,0,0.85)'
  ctx.lineWidth = 6
  ctx.font = 'bold 48px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const label = `${hp} / ${maxHp}`
  ctx.strokeText(label, W / 2, H / 2)
  ctx.fillText(label, W / 2, H / 2)
}

function buildHpBar(hp, maxHp) {
  const canvas = document.createElement('canvas')
  canvas.width = HP_CANVAS_W
  canvas.height = HP_CANVAS_H
  const ctx = canvas.getContext('2d')
  drawHpBar(ctx, hp, maxHp)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(HP_BAR_WIDTH, HP_BAR_HEIGHT), mat)
  return { mesh, canvas, ctx, tex, mat }
}

function buildAnswerGate(answerText, maxHp, isCorrect) {
  const group = new THREE.Group()

  // §3-5: 정답/오답 둘 다 같은 색
  // Phase 8.5: 다크 글래스 톤 + emissive
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x4A90E2,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide,
    depthWrite: false,
    emissive: 0x2196F3,
    emissiveIntensity: 0.4,
  })
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(GATE_WIDTH, GATE_HEIGHT, GATE_THICKNESS),
    wallMat,
  )
  wall.position.y = GATE_HEIGHT / 2
  group.add(wall)

  // Phase 8.5: 게이트 프레임 — 상하좌우 (발광 다크블루)
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1976D2,
    emissive: 0x1976D2,
    emissiveIntensity: 0.7,
    metalness: 0.4,
    roughness: 0.3,
  })
  // 상단
  const topFrame = new THREE.Mesh(
    new THREE.BoxGeometry(GATE_WIDTH + FRAME_THICKNESS * 2, FRAME_THICKNESS, FRAME_THICKNESS * 1.4),
    frameMat,
  )
  topFrame.position.y = GATE_HEIGHT + FRAME_THICKNESS / 2
  group.add(topFrame)
  // 하단
  const bottomFrame = new THREE.Mesh(
    new THREE.BoxGeometry(GATE_WIDTH + FRAME_THICKNESS * 2, FRAME_THICKNESS, FRAME_THICKNESS * 1.4),
    frameMat,
  )
  bottomFrame.position.y = -FRAME_THICKNESS / 2 + 0.05
  group.add(bottomFrame)
  // 좌측 기둥
  const leftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(FRAME_THICKNESS, GATE_HEIGHT + FRAME_THICKNESS * 2, FRAME_THICKNESS * 1.4),
    frameMat,
  )
  leftFrame.position.set(-GATE_WIDTH / 2 - FRAME_THICKNESS / 2, GATE_HEIGHT / 2, 0)
  group.add(leftFrame)
  // 우측 기둥
  const rightFrame = new THREE.Mesh(
    new THREE.BoxGeometry(FRAME_THICKNESS, GATE_HEIGHT + FRAME_THICKNESS * 2, FRAME_THICKNESS * 1.4),
    frameMat,
  )
  rightFrame.position.set(GATE_WIDTH / 2 + FRAME_THICKNESS / 2, GATE_HEIGHT / 2, 0)
  group.add(rightFrame)

  // 답 라벨 (양면) — Phase 8.5: 더 크게
  const labelTex = makeAnswerTexture(String(answerText))
  const labelMat = new THREE.MeshBasicMaterial({
    map: labelTex,
    side: THREE.DoubleSide,
    transparent: true,
  })
  const labelGeo = new THREE.PlaneGeometry(GATE_WIDTH * 0.9, 2.0)
  const labelFront = new THREE.Mesh(labelGeo, labelMat)
  labelFront.position.set(0, GATE_HEIGHT / 2, GATE_THICKNESS / 2 + 0.02)
  group.add(labelFront)
  const labelBack = new THREE.Mesh(labelGeo, labelMat)
  labelBack.position.set(0, GATE_HEIGHT / 2, -GATE_THICKNESS / 2 - 0.02)
  labelBack.rotation.y = Math.PI
  group.add(labelBack)

  // HP 바 (게이트 위, 살짝 위로)
  const hpBar = buildHpBar(maxHp, maxHp)
  hpBar.mesh.position.set(0, GATE_HEIGHT + 0.85, GATE_THICKNESS / 2 + 0.02)
  group.add(hpBar.mesh)

  group.userData = {
    kind: 'gate',
    answerText: String(answerText),
    isCorrect,
    hp: maxHp,
    maxHp,
    broken: false,
    wallMat, labelMat, labelTex,
    hpBar,
  }
  return group
}

function buildProblemPanel(question) {
  const tex = makeProblemTexture(question)
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(PROBLEM_PANEL_WIDTH, PROBLEM_PANEL_HEIGHT),
    mat,
  )
  mesh.position.y = GATE_HEIGHT + 1.5
  mesh.rotation.x = -0.35
  mesh.userData = { mat, tex }
  return mesh
}

function applyDamage(gateGroup, dmg) {
  const d = gateGroup.userData
  if (d.broken) return false
  d.hp = Math.max(0, d.hp - dmg)
  drawHpBar(d.hpBar.ctx, d.hp, d.maxHp)
  d.hpBar.tex.needsUpdate = true
  if (d.hp <= 0) {
    d.broken = true
    return true
  }
  return false
}

export class GateManager {
  constructor(scene, { grade = 3, stage = 1 } = {}) {
    this.scene = scene
    this.grade = grade
    this.stage = stage
    this.pairs = []
    this.nextSpawnZ = -54   // v2.2.1: 환경 0.18 × 300프레임(5초) = 54
    this.spawnInterval = 40 // §3-6: 8~12초 사이
  }

  setGrade(grade) { this.grade = grade }
  setStage(stage) { this.stage = stage }

  spawn() {
    const problem = generateProblem(this.grade, this.stage)
    const correctOnLeft = Math.random() < 0.5
    const leftAnswer = correctOnLeft ? problem.correct : problem.wrong
    const rightAnswer = correctOnLeft ? problem.wrong : problem.correct
    const leftHp  = correctOnLeft ? GATE_CORRECT_HP : GATE_WRONG_HP
    const rightHp = correctOnLeft ? GATE_WRONG_HP : GATE_CORRECT_HP

    const left = buildAnswerGate(leftAnswer, leftHp, correctOnLeft)
    left.position.set(-ROAD_WIDTH / 4, 0, this.nextSpawnZ)
    const right = buildAnswerGate(rightAnswer, rightHp, !correctOnLeft)
    right.position.set(ROAD_WIDTH / 4, 0, this.nextSpawnZ)

    const panel = buildProblemPanel(problem.question)
    panel.position.set(0, GATE_HEIGHT + 1.5, this.nextSpawnZ)

    this.scene.add(left)
    this.scene.add(right)
    this.scene.add(panel)

    this.pairs.push({
      left, right, panel, problem,
      z: this.nextSpawnZ,
      triggered: false,
    })
    this.nextSpawnZ -= this.spawnInterval
  }

  update(speed, leaderX, callbacks, leaderZ = 0) {
    while (this.pairs.length < 3) this.spawn()

    for (let i = this.pairs.length - 1; i >= 0; i--) {
      const pair = this.pairs[i]
      pair.z += speed
      pair.left.position.z = pair.z
      pair.right.position.z = pair.z
      pair.panel.position.z = pair.z

      // 통과/충돌 판정 (게이트가 리더 라인 도달 — Phase 8.6: 후퇴 시 늦게 트리거)
      if (!pair.triggered && pair.z >= leaderZ) {
        pair.triggered = true
        const hit = leaderX < 0 ? pair.left : pair.right
        const d = hit.userData
        if (d.broken) {
          callbacks?.onPass?.({
            correct: d.isCorrect,
            position: hit.position.clone(),
            problem: pair.problem,
            chosenAnswer: d.answerText,
          })
        } else {
          callbacks?.onCollide?.({
            correct: d.isCorrect,
            position: hit.position.clone(),
            problem: pair.problem,
            chosenAnswer: d.answerText,
          })
        }
      }

      if (pair.z > 12) {
        this._dispose(pair.left)
        this._dispose(pair.right)
        this._dispose(pair.panel)
        this.pairs.splice(i, 1)
        this.nextSpawnZ = Math.min(this.nextSpawnZ, this._farthestZ() - this.spawnInterval)
        this.spawn()
      }
    }
  }

  // 사격 타겟용 — 안 깨졌고 아직 통과 안 한 게이트 중 가장 가까운 것
  nearestActive(leaderX, leaderZ = 0) {
    let best = null
    let bestDist = Infinity
    for (const pair of this.pairs) {
      for (const g of [pair.left, pair.right]) {
        if (g.userData.broken) continue
        if (g.position.z > leaderZ) continue
        const dx = g.position.x - leaderX
        const dz = g.position.z - leaderZ
        const d = dx * dx + dz * dz
        if (d < bestDist) { bestDist = d; best = g }
      }
    }
    return best
  }

  // bullet과 게이트 충돌 검사 — hit이면 데미지 적용
  checkBulletHit(bullet) {
    for (const pair of this.pairs) {
      for (const g of [pair.left, pair.right]) {
        const d = g.userData
        if (d.broken) continue
        const dx = bullet.x - g.position.x
        const dz = bullet.z - g.position.z
        if (Math.abs(dx) > GATE_WIDTH / 2) continue
        if (Math.abs(dz) > 0.5) continue
        const justBroken = applyDamage(g, bullet.damage)
        return { hit: true, broken: justBroken, gate: g }
      }
    }
    return null
  }

  _farthestZ() {
    let min = 0
    for (const p of this.pairs) if (p.z < min) min = p.z
    return min
  }

  _dispose(obj) {
    this.scene.remove(obj)
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        for (const m of mats) {
          if (m.map) m.map.dispose()
          m.dispose()
        }
      }
    })
  }
}
