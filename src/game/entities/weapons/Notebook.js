import * as THREE from 'three'

// Lv1: 노트 던지기 — 얇은 직사각 판 + 스프링
export function createNotebookMesh() {
  const group = new THREE.Group()

  const noteGeo = new THREE.BoxGeometry(0.5, 0.06, 0.7)
  const noteMat = new THREE.MeshStandardMaterial({
    color: 0xFFF59D,
    roughness: 0.6,
    emissive: 0xFFD600,
    emissiveIntensity: 0.35,
  })
  const note = new THREE.Mesh(noteGeo, noteMat)
  group.add(note)

  const springMat = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.6, roughness: 0.4 })
  const springGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 5)
  for (let i = 0; i < 5; i++) {
    const spring = new THREE.Mesh(springGeo, springMat)
    spring.position.set(-0.2 + i * 0.1, 0.05, -0.32)
    spring.rotation.x = Math.PI / 2
    group.add(spring)
  }

  return group
}
