import * as THREE from 'three'
import { COLORS, CROWD_START, CROWD_MAX } from '../config.js'
import { wedgeFormation } from '../utils/formation.js'

// GAME_DESIGN v2.1 §10-1-2 — 친구 (Crowd)
// 주인공은 별도 (Player.js). Crowd는 친구만 InstancedMesh로 관리.
// 외부에서는 "총 인원(count)" 추상화로 본다: count = 1(leader) + friendCount.

const MAX_INSTANCES = CROWD_MAX
const AXIS_X = new THREE.Vector3(1, 0, 0)
const SCALE_ONE = new THREE.Vector3(1, 1, 1)

// Phase 8.7: 다크 톤 티셔츠 4색 (Hades 팔레트)
const FRIEND_COLORS = [0x006064, 0x6A1B9A, 0x283593, 0x424242]

export class Crowd {
  constructor() {
    this.group = new THREE.Group()
    this.friendCount = 0
    this.walkPhase = 0
    this.smoothX = 0
    this.smoothZ = 0   // Phase 8.6: 리더 z 추적

    const mat = (color) => new THREE.MeshStandardMaterial({ color })

    this.parts = {
      // body는 instanceColor로 4색 다양화 — 머티리얼 기본은 흰색
      body: new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.7, 0.4), mat(0xFFFFFF), MAX_INSTANCES),
      head: new THREE.InstancedMesh(new THREE.SphereGeometry(0.3, 12, 12), mat(COLORS.skin), MAX_INSTANCES),
      legL: new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), mat(COLORS.pants), MAX_INSTANCES),
      legR: new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), mat(COLORS.pants), MAX_INSTANCES),
      armL: new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 0.55, 0.15), mat(COLORS.skin), MAX_INSTANCES),
      armR: new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 0.55, 0.15), mat(COLORS.skin), MAX_INSTANCES),
    }
    for (const mesh of Object.values(this.parts)) {
      mesh.castShadow = true
      mesh.count = 0
      this.group.add(mesh)
    }

    // 모든 인스턴스에 색 미리 할당 (인덱스 % 4)
    const c = new THREE.Color()
    for (let i = 0; i < MAX_INSTANCES; i++) {
      c.setHex(FRIEND_COLORS[i % FRIEND_COLORS.length])
      this.parts.body.setColorAt(i, c)
    }
    if (this.parts.body.instanceColor) {
      this.parts.body.instanceColor.needsUpdate = true
    }

    this._m = new THREE.Matrix4()
    this._q = new THREE.Quaternion()
    this._p = new THREE.Vector3()

    this.setCount(CROWD_START)
  }

  // count = 친구 수 (주인공은 항상 별도)
  setCount(n) {
    this.friendCount = Math.max(0, Math.min(CROWD_MAX, n | 0))
    for (const mesh of Object.values(this.parts)) {
      mesh.count = this.friendCount
    }
  }

  get count() { return this.friendCount }

  add(n = 1) { this.setCount(this.count + n) }

  // v2.3.1 §8.0.5 — 집중 포화: 군단 중 N명 무작위 선택 (월드 좌표 반환)
  // 풀: 리더(leaderX, leaderZ) + 친구(leaderX + ox, leaderZ + oz). 매번 다른 멤버.
  pickRandomMembers(count, leaderX, leaderZ = 0) {
    const pool = [{ x: leaderX, z: leaderZ }]
    if (this.friendCount > 0) {
      const positions = wedgeFormation(this.friendCount)
      for (let i = 0; i < this.friendCount; i++) {
        const [ox, oz] = positions[i]
        pool.push({ x: this.smoothX + ox, z: this.smoothZ + oz })
      }
    }
    // Fisher–Yates partial shuffle (필요한 count만 섞음)
    const n = Math.min(count, pool.length)
    for (let i = 0; i < n; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i))
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp
    }
    return pool.slice(0, n)
  }

  update(leaderX, leaderZ = 0, isRetreating = false) {
    this.smoothX += (leaderX - this.smoothX) * 0.2
    this.smoothZ += (leaderZ - this.smoothZ) * 0.2

    if (this.friendCount === 0) return

    // 후퇴 중에는 걷기 정지 (다리 천천히 휴식 자세로)
    const phaseStep = isRetreating ? 0 : 0.25
    this.walkPhase += phaseStep
    const swingRaw = Math.sin(this.walkPhase) * 0.3
    const swing = isRetreating ? swingRaw * 0.1 : swingRaw
    const bob = isRetreating ? 0 : Math.abs(Math.sin(this.walkPhase)) * 0.05
    const positions = wedgeFormation(this.friendCount)

    const m = this._m
    const q = this._q
    const p = this._p
    const identity = new THREE.Quaternion()
    const qLeg = new THREE.Quaternion().setFromAxisAngle(AXIS_X, swing)
    const qLegR = new THREE.Quaternion().setFromAxisAngle(AXIS_X, -swing)
    const qArmL = new THREE.Quaternion().setFromAxisAngle(AXIS_X, -swing * 0.8)
    const qArmR = new THREE.Quaternion().setFromAxisAngle(AXIS_X, swing * 0.8)

    for (let i = 0; i < this.friendCount; i++) {
      const [ox, oz] = positions[i]
      const bx = this.smoothX + ox
      const by = bob
      const bz = this.smoothZ + oz  // Phase 8.6: 리더 z 따라 함께 이동

      p.set(bx, by + 0.85, bz); q.copy(identity)
      m.compose(p, q, SCALE_ONE); this.parts.body.setMatrixAt(i, m)
      p.set(bx, by + 1.5, bz)
      m.compose(p, q, SCALE_ONE); this.parts.head.setMatrixAt(i, m)
      p.set(bx - 0.18, by + 0.3, bz)
      m.compose(p, qLeg, SCALE_ONE); this.parts.legL.setMatrixAt(i, m)
      p.set(bx + 0.18, by + 0.3, bz)
      m.compose(p, qLegR, SCALE_ONE); this.parts.legR.setMatrixAt(i, m)
      p.set(bx - 0.4, by + 0.9, bz)
      m.compose(p, qArmL, SCALE_ONE); this.parts.armL.setMatrixAt(i, m)
      p.set(bx + 0.4, by + 0.9, bz)
      m.compose(p, qArmR, SCALE_ONE); this.parts.armR.setMatrixAt(i, m)
    }

    for (const mesh of Object.values(this.parts)) {
      mesh.instanceMatrix.needsUpdate = true
    }
  }
}
