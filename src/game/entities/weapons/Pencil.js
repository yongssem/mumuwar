import * as THREE from 'three'

// Lv3: 연필 화살 — 육각 기둥 + 뾰족 끝 + 분홍 지우개 + 은색 밴드
export function createPencilMesh() {
  const group = new THREE.Group()

  // 몸통 (육각)
  const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xFBC02D,
    roughness: 0.4,
    emissive: 0xFFD600,
    emissiveIntensity: 0.55,
  })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.rotation.x = Math.PI / 2
  group.add(body)

  // 뾰족 끝 (검은 심) — 앞쪽 = -Z
  const tipGeo = new THREE.ConeGeometry(0.08, 0.22, 6)
  const tipMat = new THREE.MeshStandardMaterial({ color: 0x212121 })
  const tip = new THREE.Mesh(tipGeo, tipMat)
  tip.position.z = -0.51
  tip.rotation.x = -Math.PI / 2
  group.add(tip)

  // 지우개 (분홍 뒷부분)
  const eraserGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.14, 6)
  const eraserMat = new THREE.MeshStandardMaterial({ color: 0xF48FB1, roughness: 0.7 })
  const eraser = new THREE.Mesh(eraserGeo, eraserMat)
  eraser.position.z = 0.47
  eraser.rotation.x = Math.PI / 2
  group.add(eraser)

  // 금속 밴드
  const bandGeo = new THREE.CylinderGeometry(0.092, 0.092, 0.05, 6)
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xBDBDBD,
    metalness: 0.7,
    roughness: 0.3,
  })
  const band = new THREE.Mesh(bandGeo, bandMat)
  band.position.z = 0.38
  band.rotation.x = Math.PI / 2
  group.add(band)

  return group
}
