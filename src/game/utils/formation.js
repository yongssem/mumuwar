// GAME_DESIGN v2.1 §10-2 — V자 (wedge) 포메이션
// 주인공은 (0, 0). 친구는 행 1부터 시작, 행 N에 2N명, 행 간격 0.7, 친구 간격 0.6.

const ROW_GAP = 0.7
const COL_GAP = 0.6

export function wedgeFormation(friendCount) {
  const positions = []
  let placed = 0
  let row = 1
  while (placed < friendCount) {
    const inRow = row * 2
    const startX = -((inRow - 1) * COL_GAP) / 2
    for (let i = 0; i < inRow && placed < friendCount; i++) {
      positions.push([startX + i * COL_GAP, row * ROW_GAP])
      placed++
    }
    row++
  }
  return positions
}
