import { ROAD_WIDTH, DRAG_SENSITIVITY } from './config.js'

export function createDragInput(canvas, state, onFirstInput) {
  let dragging = false
  let lastX = 0
  let firedFirst = false

  const limit = ROAD_WIDTH / 2 - 0.5

  const getX = (e) => (e.touches ? e.touches[0].clientX : e.clientX)

  const onDown = (e) => {
    dragging = true
    lastX = getX(e)
    if (!firedFirst) {
      firedFirst = true
      onFirstInput?.()
    }
  }
  const onMove = (e) => {
    if (!dragging) return
    const x = getX(e)
    const dx = ((x - lastX) / window.innerWidth) * DRAG_SENSITIVITY
    state.targetX = Math.max(-limit, Math.min(limit, state.targetX + dx))
    lastX = x
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
