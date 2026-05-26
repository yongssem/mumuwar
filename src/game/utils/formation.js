// Phase 8.9 — Swarm Formation (뱀파이어 서바이버스 톤)
// 골든 앵글(해바라기 패턴) + √i 반경 → 자연스러운 뭉친 떼거리.
// V자 행/열 폐기. SPACING 만으로 밀도 제어.

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)) // ≈ 137.5°
const BASE_SPACING = 0.4
const DENSE_SPACING = 0.35 // 200명 이상 시 길 폭(8유닛) 안에 수렴시키기 위한 보정

/**
 * 주인공 + 친구 떼거리의 상대 좌표.
 * @param {number} crowdSize 친구 수 (주인공 제외)
 * @returns {Array<{x:number, z:number, isLeader:boolean, phaseOffset:number}>}
 *   index 0 = 주인공 (0,0). index 1.. = 친구들.
 */
export function calculateSwarmPositions(crowdSize) {
  const positions = []
  positions.push({ x: 0, z: 0, isLeader: true, phaseOffset: 0 })

  // 200명 이상이면 SPACING을 살짝 줄여 길 폭 안에 수렴
  const SPACING = crowdSize >= 200 ? DENSE_SPACING : BASE_SPACING

  for (let i = 0; i < crowdSize; i++) {
    const angle = i * GOLDEN_ANGLE
    const radius = SPACING * Math.sqrt(i + 1)
    positions.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      isLeader: false,
      // 인덱스 기반 결정적 위상 — 프레임 간 안정, 친구마다 살짝 다르게
      phaseOffset: (i * 0.7547) % (Math.PI * 2),
    })
  }

  return positions
}
