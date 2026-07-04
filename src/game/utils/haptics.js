// 모바일 햅틱 피드백 — navigator.vibrate 지원 기기에서만 동작 (iOS Safari는 무시됨)

let enabled = true

export function setHapticsEnabled(v) { enabled = !!v }

export function vibrate(pattern) {
  if (!enabled) return
  try { navigator.vibrate?.(pattern) } catch { /* noop */ }
}

// 프리셋 — 게임 이벤트별 촉감 구분
export const HAPTIC = {
  gateCorrect: 25,
  gateWrong: [40, 40, 40],
  crowdHit: 35,
  feverStart: [30, 30, 60],
  bossWarn: [60, 40, 60],
  bossDie: [60, 60, 120],
  go: 20,
}
