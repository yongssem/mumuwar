import * as THREE from 'three'
import { CROWD_START, CROWD_MAX } from '../config.js'
import { calculateSwarmPositions } from '../utils/formation.js'
import { loadPixelTexture } from '../utils/spriteLoader.js'

// Phase 8.12 — 친구 군단 픽셀아트 통합
// 기존 6개 InstancedMesh (body/head/legs/arms) 폐기.
// 단일 InstancedMesh(PlaneGeometry + friend-base-idle 텍스처) + 빌보드.
// + InstancedMesh(CircleGeometry) 그림자 별도.

const MAX_INSTANCES = CROWD_MAX
const UP = new THREE.Vector3(0, 1, 0)

// 친구 plane 크기 (월드 단위). 리더(2.75)보다 살짝 작아 히어로 팝.
const FRIEND_WIDTH = 1.6
const FRIEND_HEIGHT = 2.0
const FRIEND_BASE_Y = FRIEND_HEIGHT / 2 // 평면 중심 = 0.5 × height

// Phase 8.7 다크 톤 4색 → 8.12: 회색조 텍스처 곱 합성 보정으로 약간 더 밝게
const FRIEND_TINTS = [0x00BCD4, 0xAB47BC, 0x5C6BC0, 0xBDBDBD]

export class Crowd {
  constructor(camera) {
    this.group = new THREE.Group()
    this.camera = camera
    this.friendCount = 0
    // Phase 8.13: walkPhase 폐기 — 각 친구가 phaseOffset로 자체 박자
    this.smoothX = 0
    this.smoothZ = 0

    // 빌보드 친구 plane
    const planeGeo = new THREE.PlaneGeometry(FRIEND_WIDTH, FRIEND_HEIGHT)
    const planeMat = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      map: null,
      depthWrite: false,
    })
    // 텍스처 비동기 로드 — 도착하면 머티리얼 갱신
    const tex = loadPixelTexture('characters', 'friend-base-idle', () => {
      planeMat.map = tex
      planeMat.needsUpdate = true
    })
    planeMat.map = tex
    this.plane = new THREE.InstancedMesh(planeGeo, planeMat, MAX_INSTANCES)
    this.plane.count = 0
    this.plane.frustumCulled = false
    this.group.add(this.plane)

    // 그림자 InstancedMesh — 빌보드 X, 바닥에 평평하게
    const shadowGeo = new THREE.CircleGeometry(0.45, 12)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
    this.shadows = new THREE.InstancedMesh(shadowGeo, shadowMat, MAX_INSTANCES)
    this.shadows.count = 0
    this.shadows.frustumCulled = false
    this.group.add(this.shadows)

    // 컬러 tint 미리 할당 (모든 인스턴스 4색 순환)
    const c = new THREE.Color()
    for (let i = 0; i < MAX_INSTANCES; i++) {
      c.setHex(FRIEND_TINTS[i % FRIEND_TINTS.length])
      this.plane.setColorAt(i, c)
    }
    if (this.plane.instanceColor) this.plane.instanceColor.needsUpdate = true

    // 재사용 가능한 객체 (allocation 최소화)
    this._mPlane = new THREE.Matrix4()
    this._mShadow = new THREE.Matrix4()
    this._tmpMatrix = new THREE.Matrix4()
    this._eye = new THREE.Vector3()
    this._pos = new THREE.Vector3()
    this._shadowPos = new THREE.Vector3()
    this._shadowScale = new THREE.Vector3(1, 1, 1)
    this._shadowQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
    this._scaleOne = new THREE.Vector3(1, 1, 1)
    // Phase 8.13: 빌보드 × 틸트 합성용
    this._billboardQuat = new THREE.Quaternion()
    this._tiltQuat = new THREE.Quaternion()
    this._zAxis = new THREE.Vector3(0, 0, 1)

    // 포메이션 캐시
    this._cachedPositions = null
    this._cachedFor = -1

    this.setCount(CROWD_START)
  }

  _getPositions() {
    if (this._cachedFor !== this.friendCount) {
      this._cachedPositions = calculateSwarmPositions(this.friendCount)
      this._cachedFor = this.friendCount
    }
    return this._cachedPositions
  }

  setCount(n) {
    this.friendCount = Math.max(0, Math.min(CROWD_MAX, n | 0))
    this.plane.count = this.friendCount
    this.shadows.count = this.friendCount
  }

  get count() { return this.friendCount }

  add(n = 1) { this.setCount(this.count + n) }

  // v2.3.1 §8.0.5 — 집중 포화 풀
  pickRandomMembers(count, leaderX, leaderZ = 0) {
    const pool = [{ x: leaderX, z: leaderZ }]
    if (this.friendCount > 0) {
      const positions = this._getPositions()
      for (let i = 0; i < this.friendCount; i++) {
        const p = positions[i + 1]
        pool.push({ x: this.smoothX + p.x, z: this.smoothZ + p.z })
      }
    }
    const n = Math.min(count, pool.length)
    for (let i = 0; i < n; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i))
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp
    }
    return pool.slice(0, n)
  }

  // 카메라가 매 프레임 바뀌므로 외부에서 갱신 가능하게 expose
  setCamera(camera) { this.camera = camera }

  // Phase 8.13: 친구마다 phaseOffset로 박자 차이 → "살아있는 군중"
  update(leaderX, leaderZ = 0, isRetreating = false) {
    this.smoothX += (leaderX - this.smoothX) * 0.2
    this.smoothZ += (leaderZ - this.smoothZ) * 0.2

    if (this.friendCount === 0) return

    const positions = this._getPositions()
    const tMs = performance.now()
    const tSway = tMs * 0.002      // 느린 떼거리 흔들림 (Phase 8.9)
    const tWalk = tMs * 0.005      // 빠른 걷기 사이클 (Phase 8.13)
    const cam = this.camera
    const camPos = cam ? cam.position : null

    const mPlane = this._mPlane
    const mShadow = this._mShadow
    const tmpMatrix = this._tmpMatrix
    const eye = this._eye
    const pos = this._pos
    const shadowPos = this._shadowPos
    const shadowScale = this._shadowScale
    const shadowQuat = this._shadowQuat
    const scaleOne = this._scaleOne
    const billboardQ = this._billboardQuat
    const tiltQ = this._tiltQuat
    const zAxis = this._zAxis

    for (let i = 0; i < this.friendCount; i++) {
      const fp = positions[i + 1]
      const ph = fp.phaseOffset

      // 느린 떼거리 흔들림 (각자 다른 위상으로 살아있는 느낌)
      const swayX = Math.sin(tSway + ph) * 0.08
      const swayZ = Math.cos(tSway * 0.7 + ph) * 0.06

      // 걷기 sin 모션 (후퇴 시 정지)
      const walkY = isRetreating ? 0 : Math.sin(tWalk + ph) * 0.08
      const tilt = isRetreating ? 0 : Math.sin(tWalk + ph) * 0.05

      const bx = this.smoothX + fp.x + swayX
      const bz = this.smoothZ + fp.z + swayZ
      const by = FRIEND_BASE_Y + walkY

      pos.set(bx, by, bz)

      // 빌보드 회전 (카메라 향함)
      if (camPos) {
        eye.copy(camPos)
        tmpMatrix.lookAt(eye, pos, UP)
        billboardQ.setFromRotationMatrix(tmpMatrix)
      } else {
        billboardQ.identity()
      }
      // 로컬 Z축 틸트 — 빌보드 좌표계에서 화면 평면 회전 (좌우 기울기)
      tiltQ.setFromAxisAngle(zAxis, tilt)
      billboardQ.multiply(tiltQ)

      mPlane.compose(pos, billboardQ, scaleOne)
      this.plane.setMatrixAt(i, mPlane)

      // 그림자: 발 올라가면 살짝 작아짐 (양수 heightRatio만)
      const heightRatio = Math.max(0, walkY / 0.08)
      const ss = 1.0 - heightRatio * 0.05
      shadowScale.set(ss, ss, ss)
      shadowPos.set(bx, 0.02, bz)
      mShadow.compose(shadowPos, shadowQuat, shadowScale)
      this.shadows.setMatrixAt(i, mShadow)
    }

    this.plane.instanceMatrix.needsUpdate = true
    this.shadows.instanceMatrix.needsUpdate = true
  }
}
