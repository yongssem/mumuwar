import * as THREE from 'three'

// Lv5: 사전 — 두꺼운 책 + 금장 + 빛나는 오라
export function createDictionaryMesh() {
  const group = new THREE.Group()

  // 표지 (붉은 책)
  const bookGeo = new THREE.BoxGeometry(0.55, 0.28, 0.78)
  const bookMat = new THREE.MeshStandardMaterial({
    color: 0xB71C1C,
    roughness: 0.4,
    metalness: 0.2,
    emissive: 0xE53935,
    emissiveIntensity: 0.35,
  })
  const book = new THREE.Mesh(bookGeo, bookMat)
  group.add(book)

  // 페이지 (옆면 흰색)
  const pageGeo = new THREE.BoxGeometry(0.53, 0.25, 0.76)
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xFFF8E1,
    roughness: 0.9,
  })
  const pages = new THREE.Mesh(pageGeo, pageMat)
  pages.position.x = 0.015
  group.add(pages)

  // 금색 장식 (위/아래)
  const stripMat = new THREE.MeshStandardMaterial({
    color: 0xFFC107,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xFFD600,
    emissiveIntensity: 0.7,
  })
  const stripGeo = new THREE.BoxGeometry(0.56, 0.045, 0.8)
  const stripTop = new THREE.Mesh(stripGeo, stripMat)
  stripTop.position.y = 0.12
  group.add(stripTop)
  const stripBottom = new THREE.Mesh(stripGeo, stripMat)
  stripBottom.position.y = -0.12
  group.add(stripBottom)

  // 오라 (펄스용)
  const auraGeo = new THREE.SphereGeometry(0.65, 14, 14)
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xFFD600,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  })
  const aura = new THREE.Mesh(auraGeo, auraMat)
  aura.userData.isAura = true
  group.add(aura)

  return group
}
