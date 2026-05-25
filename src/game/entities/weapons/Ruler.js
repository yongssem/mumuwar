import * as THREE from 'three'

// Lv2: 자 휘두르기 — 길쭉 막대 + 검은 눈금
export function createRulerMesh() {
  const group = new THREE.Group()

  const rulerGeo = new THREE.BoxGeometry(0.18, 0.05, 1.4)
  const rulerMat = new THREE.MeshStandardMaterial({
    color: 0xFFA000,
    roughness: 0.5,
    emissive: 0xFFC107,
    emissiveIntensity: 0.45,
  })
  const ruler = new THREE.Mesh(rulerGeo, rulerMat)
  group.add(ruler)

  const markerMat = new THREE.MeshBasicMaterial({ color: 0x212121 })
  const markerGeo = new THREE.BoxGeometry(0.16, 0.006, 0.025)
  for (let i = 0; i < 10; i++) {
    const marker = new THREE.Mesh(markerGeo, markerMat)
    marker.position.set(0, 0.028, -0.6 + i * 0.13)
    group.add(marker)
  }

  return group
}
