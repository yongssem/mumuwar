import * as THREE from 'three'
import { ROAD_WIDTH, ROAD_LENGTH } from './config.js'

const LOOP = 120
const FLOOR_END = 20
const wrapZ = (z) => FLOOR_END - (((FLOOR_END - z) % LOOP) + LOOP) % LOOP

// 작은 캔버스 텍스처와 인스턴스 메시로 야간 학원가를 구성한다.
// 매 프레임 새 메시나 텍스처를 생성하지 않는다.
function makeSurface(kind) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = kind === 'road' ? '#656b78' : '#9297a1'
  ctx.fillRect(0, 0, 256, 256)
  let seed = 2731
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = random() > .5 ? 'rgba(255,255,255,.055)' : 'rgba(0,0,0,.08)'
    ctx.fillRect(random() * 256, random() * 256, 1 + random() * 2, 1)
  }
  if (kind === 'paving') {
    ctx.strokeStyle = 'rgba(23,31,46,.28)'
    ctx.lineWidth = 2
    for (let y = 0; y <= 256; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke()
      for (let x = (y % 64 ? 16 : 0); x <= 256; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 32); ctx.stroke()
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

function makeLightPool() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,211,139,.20)')
  gradient.addColorStop(.45, 'rgba(255,211,139,.08)')
  gradient.addColorStop(1, 'rgba(255,211,139,0)')
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

function makeSign(text, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 80
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#162637'; ctx.fillRect(0, 0, 256, 80)
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(5, 5, 246, 70)
  ctx.font = '700 36px Pretendard, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = color; ctx.fillText(text, 128, 42)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export class StreetEnvironment {
  constructor(scene, theme) {
    this.group = new THREE.Group()
    this.group.name = 'school-street-environment'
    scene.add(this.group)
    this.travel = 0
    this.rows = new Map()
    this.batches = []
    this.signs = []
    this.matrix = new THREE.Matrix4()
    this.position = new THREE.Vector3()
    this.scale = new THREE.Vector3()
    this.quaternion = new THREE.Quaternion()
    this.floorQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1)
    this.shrubGeometry = new THREE.IcosahedronGeometry(1, 1)
    this.planeGeometry = new THREE.PlaneGeometry(1, 1)
    this.textures = [makeSurface('road'), makeSurface('paving'), makeLightPool()]
    this.textures[0].repeat.set(1, ROAD_LENGTH / 8)
    this.textures[1].repeat.set(1, ROAD_LENGTH / 2)
    this.materials = {
      facade: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .94 }),
      concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }),
      metal: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .65, metalness: .25 }),
      leaves: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }),
      window: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      pools: new THREE.MeshBasicMaterial({ map: this.textures[2], transparent: true, depthWrite: false, opacity: .7 }),
      lane: new THREE.MeshBasicMaterial({ color: 0xa6b4be, transparent: true, opacity: .38, depthWrite: false }),
    }
    this.road = this._floor(ROAD_WIDTH, 0, .005, new THREE.MeshStandardMaterial({
      color: theme.road, map: this.textures[0], roughness: .86, metalness: .08,
      emissive: 0x152039, emissiveIntensity: .22,
    }))
    this.ground = this._floor(100, 0, -.035, new THREE.MeshStandardMaterial({ color: theme.grass, roughness: 1 }))
    const paving = new THREE.MeshStandardMaterial({ color: 0x667587, map: this.textures[1], roughness: .96 })
    this._floor(2.3, -5.3, .06, paving)
    this._floor(2.3, 5.3, .06, paving)
    for (let z = 16; z > -104; z -= 4) {
      this._part('lane', 0, .025, z, .075, 1, 1.65, 0xffffff, 'plane')
      for (const side of [-1, 1]) {
        this._part('concrete', side * 4.08, .10, z, .18, .20, 3.9, 0x7e8997)
        this._part('metal', side * 3.91, .018, z, .035, .025, 3.9, 0x698e9b)
      }
    }
    const shops = [['문구점', '#e4cf9d'], ['작은 서점', '#99c8c6'], ['배움 학원', '#c4b5dc']]
    for (let i = 0; i < 6; i++) {
      for (const side of [-1, 1]) this._block(side, -i * 20 - 8, i, shops)
    }
    this._buildBatches()
    this.update(0)
  }

  _floor(width, x, y, material) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, ROAD_LENGTH), material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(x, y, -65)
    mesh.receiveShadow = true
    this.group.add(mesh)
    return mesh
  }

  _part(material, x, y, z, sx, sy, sz, color, shape = 'box') {
    const key = material + ':' + shape
    if (!this.rows.has(key)) this.rows.set(key, { material, shape, items: [] })
    this.rows.get(key).items.push({ x, y, z, sx, sy, sz, color })
  }

  _block(side, z, index, shops) {
    const height = 4.4 + ((index * 7 + (side > 0 ? 3 : 0)) % 4) * 1.05
    const colors = [0x263449, 0x303747, 0x263c40, 0x343343]
    this._part('facade', side * 9.7, height / 2, z, 6.3, height, 11.4, colors[(index + (side > 0 ? 1 : 0)) % colors.length])
    this._part('metal', side * 9.7, height + .12, z, 6.6, .22, 11.8, 0x182333)
    this._part('concrete', side * 6.51, .35, z, .12, .7, 11.4, 0x465362)
    this._part('window', side * 6.49, 1.05, z, .04, 1.8, 6.7, 0x273d4b)
    for (const dz of [-3.4, 0, 3.4]) {
      this._part('metal', side * 6.45, 1.05, z + dz, .08, 1.85, .10, 0x182733)
    }
    // 창문은 밝은 면만 인스턴스화해 실제 조명 수를 늘리지 않는다.
    for (let row = 0; row < Math.floor((height - 1) / 1.35); row++) {
      for (let column = 0; column < 5; column++) {
        const on = (row * 5 + column + index) % 4 !== 0
        if (row === 0 && column > 0 && column < 4) continue
        this._part('window', side * 6.52, 1.15 + row * 1.35, z - 4 + column * 2,
          .035, .78, 1.02, on ? ((column + index) % 3 ? 0xb79b68 : 0x7b9fa9) : 0x192636)
      }
    }
    this._part('facade', side * 6.18, 2.22, z, .8, .16, 7.2, index % 2 ? 0x3d5b60 : 0x62545a)
    this._part('metal', side * 5.82, 2.06, z, .08, .24, 7.2, 0x273344)
    if (index % 2 === 0) {
      const [label, color] = shops[(index / 2 + (side > 0 ? 1 : 0)) % shops.length]
      const texture = makeSign(label, color)
      this.textures.push(texture)
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, .92), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }))
      sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2
      this.signs.push({ mesh: sign, z })
      sign.position.set(side * 6.49, 2.95, z)
      this.group.add(sign)
    }
    // 화단과 가로등은 보도에 두어 정답 게이트의 시야를 확보한다.
    this._part('concrete', side * 5.65, .3, z + 7, 1.1, .6, 1.9, 0x4c5968)
    this._part('leaves', side * 5.65, 1.02, z + 7, .62, .67, 1.05, 0x315b52, 'shrub')
    this._part('metal', side * 4.8, 1.95, z + 3, .10, 3.9, .10, 0x263441)
    this._part('metal', side * 4.64, 3.92, z + 3, .55, .10, .50, 0x24313f)
    this._part('window', side * 4.64, 3.78, z + 3, .34, .20, .32, 0xe6c691)
    this._part('pools', side * 4.4, .075, z + 3, 3.2, 1, 5, 0xffffff, 'plane')
  }

  _buildBatches() {
    for (const { material, shape, items } of this.rows.values()) {
      const geometry = shape === 'plane' ? this.planeGeometry : shape === 'shrub' ? this.shrubGeometry : this.boxGeometry
      const mesh = new THREE.InstancedMesh(geometry, this.materials[material], items.length)
      mesh.frustumCulled = false
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      if (material !== 'pools' && material !== 'lane') {
        for (let i = 0; i < items.length; i++) mesh.setColorAt(i, new THREE.Color(items[i].color))
        mesh.instanceColor.needsUpdate = true
      }
      this.group.add(mesh)
      this.batches.push({ mesh, shape, items })
    }
  }

  update(speed) {
    this.travel = (this.travel + speed) % LOOP
    // 진행 거리에 따라 노면을 흐르게 하고, 일시정지 중에는 함께 멈춘다.
    this.textures[0].offset.y = this.travel / 8
    this.textures[1].offset.y = this.travel / 2
    for (const { mesh, shape, items } of this.batches) {
      this.quaternion.identity()
      if (shape === 'plane') this.quaternion.copy(this.floorQuaternion)
      for (let i = 0; i < items.length; i++) {
        const p = items[i]
        this.position.set(p.x, p.y, wrapZ(p.z + this.travel))
        this.scale.set(p.sx, shape === 'plane' ? p.sz : p.sy, shape === 'plane' ? 1 : p.sz)
        this.matrix.compose(this.position, this.quaternion, this.scale)
        mesh.setMatrixAt(i, this.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    for (const sign of this.signs) sign.mesh.position.z = wrapZ(sign.z + this.travel)
  }

  dispose() {
    // 텍스처와 인스턴스 버퍼를 해제하고, 지오메트리·머티리얼은 Engine이 정리한다.
    this.textures.forEach((texture) => texture.dispose())
    this.batches.forEach(({ mesh }) => mesh.dispose())
    this.rows.clear()
    this.batches.length = 0
    this.signs.length = 0
  }
}
