import { ROAD_WIDTH, DRAG_SENSITIVITY } from './config.js'

// Phase 8.6: 후퇴 이동 추가 — Y축 드래그로 z 후퇴 (시간 벌이)
const RETREAT_MAX = 5     // 뒤로 최대 5유닛
const Z_SENSITIVITY = DRAG_SENSITIVITY * 0.9

export function createDragInput(canvas, state, onFirstInput) {
  let dragging = false
  let lastX = 0
  let lastY = 0
  let firedFirst = false

  const limit = ROAD_WIDTH / 2 - 0.5

  const getX = (e) => (e.touches ? e.touches[0].clientX : e.clientX)
  const getY = (e) => (e.touches ? e.touches[0].clientY : e.clientY)

  const onDown = (e) => {
    dragging = true
    lastX = getX(e)
    lastY = getY(e)
    if (!firedFirst) {
      firedFirst = true
      onFirstInput?.()
    }
  }
  const onMove = (e) => {
    if (!dragging) return
    const x = getX(e)
    const y = getY(e)
    const rawDx = x - lastX
    const rawDy = y - lastY

    // X 이동은 항상 적용
    const dx = (rawDx / window.innerWidth) * DRAG_SENSITIVITY
    state.targetX = Math.max(-limit, Math.min(limit, state.targetX + dx))

    // Y(후퇴) 입력은 Y 변위가 X보다 클 때만 인정 — 가로 스와이프 중 미세
    // Y 떨림이 누적되어 캐릭터가 영영 "후퇴 중" 판정되는 버그 방지.
    if (Math.abs(rawDy) > Math.abs(rawDx)) {
      const dy = (rawDy / window.innerHeight) * Z_SENSITIVITY
      state.targetZ = Math.max(0, Math.min(RETREAT_MAX, (state.targetZ ?? 0) + dy))
    }

    lastX = x
    lastY = y
  }
  const onUp = () => { dragging = false }

  canvas.addEventListener('touchstart', onDown, { passive: true })
  canvas.addEventListener('touchmove', onMove, { passive: true })
  canvas.addEventListener('touchend', onUp)
  canvas.addEventListener('mousedown', onDown)
  canvas.addEventListener('mousemove', onMove)
  canvas.addEventListener('mouseup', onUp)
  canvas.addEventListener('mouseleave', onUp)

  return () => {
    canvas.removeEventListener('touchstart', onDown)
    canvas.removeEventListener('touchmove', onMove)
    canvas.removeEventListener('touchend', onUp)
    canvas.removeEventListener('mousedown', onDown)
    canvas.removeEventListener('mousemove', onMove)
    canvas.removeEventListener('mouseup', onUp)
    canvas.removeEventListener('mouseleave', onUp)
  }
}
