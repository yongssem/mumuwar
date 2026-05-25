import * as THREE from 'three'
import { COLORS } from '../config.js'

// GAME_DESIGN v2.1 §10-1-1 — 주인공 (Leader)
const LEADER_BODY = 0x4A90E2
const HAT_COLOR   = 0xE53935
const LEADER_SCALE = 1.2

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
    this.group.scale.set(LEADER_SCALE, LEADER_SCALE, LEADER_SCALE)
    this.walkPhase = 0

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.7, 0.4),
      new THREE.MeshStandardMaterial({ color: LEADER_BODY }),
    )
    body.position.y = 0.85
    body.castShadow = true
    this.group.add(body)

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({ color: COLORS.skin }),
    )
    head.position.y = 1.5
    head.castShadow = true
    this.group.add(head)

    // 빨간 모자 (chef hat 스타일: cylinder top + brim)
    const hatMat = new THREE.MeshStandardMaterial({ color: HAT_COLOR })
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 14), hatMat)
    hatTop.position.y = 1.88
    hatTop.castShadow = true
    this.group.add(hatTop)
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 16), hatMat)
    hatBrim.position.y = 1.76
    this.group.add(hatBrim)

    const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2)
    const legMat = new THREE.MeshStandardMaterial({ color: COLORS.pants })
    this.leftLeg = new THREE.Mesh(legGeo, legMat)
    this.leftLeg.position.set(-0.18, 0.3, 0)
    this.leftLeg.castShadow = true
    this.group.add(this.leftLeg)
    this.rightLeg = new THREE.Mesh(legGeo, legMat)
    this.rightLeg.position.set(0.18, 0.3, 0)
    this.rightLeg.castShadow = true
    this.group.add(this.rightLeg)

    const armGeo = new THREE.BoxGeometry(0.15, 0.55, 0.15)
    const armMat = new THREE.MeshStandardMaterial({ color: COLORS.skin })
    this.leftArm = new THREE.Mesh(armGeo, armMat)
    this.leftArm.position.set(-0.4, 0.9, 0)
    this.leftArm.castShadow = true
    this.group.add(this.leftArm)
    this.rightArm = new THREE.Mesh(armGeo, armMat)
    this.rightArm.position.set(0.4, 0.9, 0)
    this.rightArm.castShadow = true
    this.group.add(this.rightArm)

    const nameTag = makeNameTagSprite(name)
    nameTag.position.set(0, 2.35, 0)
    this.group.add(nameTag)
  }

  setX(x) { this.group.position.x = x }
  setZ(z) { this.group.position.z = z }

  // Phase 8.6: 후퇴 중에는 걷기 애니메이션 정지 (서 있는 느낌)
  update(isRetreating = false) {
    if (isRetreating) {
      // 다리/팔 천천히 휴식 자세로 복귀
      this.leftLeg.rotation.x *= 0.85
      this.rightLeg.rotation.x *= 0.85
      this.leftArm.rotation.x *= 0.85
      this.rightArm.rotation.x *= 0.85
      this.group.position.y *= 0.85
      return
    }
    this.walkPhase += 0.25
    const swing = Math.sin(this.walkPhase) * 0.3
    this.leftLeg.rotation.x = swing
    this.rightLeg.rotation.x = -swing
    this.leftArm.rotation.x = -swing * 0.8
    this.rightArm.rotation.x = swing * 0.8
    this.group.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.06
  }
}
