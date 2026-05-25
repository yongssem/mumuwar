import * as THREE from 'three'

// Lv4: 칠판지우개 — 흰 펠트 + 갈색 나무 + 분필 가루
export function createEraserMesh() {
  const group = new THREE.Group()

  // 펠트
  const feltGeo = new THREE.BoxGeometry(0.55, 0.2, 0.34)
  const feltMat = new THREE.MeshStandardMaterial({
    color: 0xECEFF1,
    roughness: 0.95,
    emissive: 0xFFFFFF,
    emissiveIntensity: 0.15,
  })
  const felt = new THREE.Mesh(feltGeo, feltMat)
  felt.position.y = 0.1
  group.add(felt)

  // 나무 몸체
  const woodGeo = new THREE.BoxGeometry(0.55, 0.12, 0.34)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5D4037,
    roughness: 0.7,
  })
  const wood = new THREE.Mesh(woodGeo, woodMat)
  wood.position.y = -0.06
  group.add(wood)

  // 분필 가루 (작은 흰 큐브 3개)
  const dustMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.65,
    emissive: 0xFFFFFF,
    emissiveIntensity: 0.3,
  })
  const dustGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06)
  for (let i = 0; i < 3; i++) {
    const dust = new THREE.Mesh(dustGeo, dustMat)
    dust.position.set(
      (Math.random() - 0.5) * 0.65,
      0.24 + Math.random() * 0.2,
      (Math.random() - 0.5) * 0.4,
    )
    dust.userData.isDust = true
    dust.userData.basePhase = Math.random() * Math.PI * 2
    group.add(dust)
  }

  return group
}
