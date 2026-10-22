import { ROAD_WIDTH, DRAG_SENSITIVITY } from './config.js'

export function createDragInput(canvas, state, onFirstInput) {
  let pointerId = null
  let lastX = 0, lastY = 0, firedFirst = false
  const keys = new Set()
  const limit = ROAD_WIDTH / 2 - 0.5
  const first = () => {
    if (!firedFirst) { firedFirst = true; onFirstInput?.() }
  }
  const down = (e) => {
    if (state.inputEnabled === false || pointerId !== null || (e.pointerType === 'mouse' && e.button !== 0)) return
    pointerId = e.pointerId
    lastX = e.clientX; lastY = e.clientY
    canvas.setPointerCapture(pointerId)
    first()
  }
  const move = (e) => {
    if (e.pointerId !== pointerId || state.inputEnabled === false) return
    const dx = e.clientX - lastX, dy = e.clientY - lastY
    const rect = canvas.getBoundingClientRect()
    state.targetX = Math.max(-limit, Math.min(limit, state.targetX + dx / rect.width * DRAG_SENSITIVITY))
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 2) {
      state.targetZ = Math.max(0, Math.min(5, state.targetZ + dy / rect.height * DRAG_SENSITIVITY * 0.9))
    }
    lastX = e.clientX; lastY = e.clientY
  }
  const up = (e) => {
    if (e.pointerId !== pointerId) return
    const id = pointerId
    pointerId = null
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id)
  }
  const syncKeys = () => {
    state.moveX = Number(keys.has('ArrowRight') || keys.has('d')) - Number(keys.has('ArrowLeft') || keys.has('a'))
    state.moveZ = Number(keys.has('ArrowDown') || keys.has('s')) - Number(keys.has('ArrowUp') || keys.has('w'))
  }
  const allowed = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's'])
  const keydown = (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    if (!allowed.has(key) || state.inputEnabled === false || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)) return
    e.preventDefault(); keys.add(key); syncKeys(); first()
  }
  const keyup = (e) => { keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); syncKeys() }
  const blur = () => { keys.clear(); state.moveX = 0; state.moveZ = 0; pointerId = null }
  const visibility = () => { if (document.hidden) blur() }
  const listeners = [
    [canvas, 'pointerdown', down], [canvas, 'pointermove', move],
    [canvas, 'pointerup', up], [canvas, 'pointercancel', up], [canvas, 'lostpointercapture', up],
    [window, 'keydown', keydown], [window, 'keyup', keyup], [window, 'blur', blur],
    [document, 'visibilitychange', visibility],
  ]
  listeners.forEach(([target, event, handler]) => target.addEventListener(event, handler))
  return () => { blur(); listeners.forEach(([target, event, handler]) => target.removeEventListener(event, handler)) }
}
