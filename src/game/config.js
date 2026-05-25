export const ROAD_WIDTH = 8
export const ROAD_LENGTH = 200

export const PLAYER_SPEED = 0.12
export const DRAG_SENSITIVITY = 12
export const PLAYER_SMOOTH = 0.15

// 학년별 속도 배율 — 낮은 학년일수록 천천히 (문제 읽을 시간 확보)
// 3학년 = 1.0 기준
export const GRADE_SPEED_MULT = {
  1: 0.55,
  2: 0.72,
  3: 1.00,
  4: 1.05,
  5: 1.10,
  6: 1.15,
}

export function getGradeSpeed(grade) {
  return PLAYER_SPEED * (GRADE_SPEED_MULT[grade] ?? 1.0)
}

// GAME_DESIGN v2.2.1 §11
export const CROWD_START = 10
export const CROWD_MAX = 200

// GAME_DESIGN v2.2 §3-4 (기본 게이트)
//  · 정답 게이트 깸 → +20 / 오답 게이트 깸 → -10 (효과)
//  · HP 남은 채 충돌 → -10 (Gate.js의 GATE_COLLISION_PENALTY)
export const GATE_BASE_REWARD = 20
export const GATE_BASE_PENALTY = 10
export const GATE_COLOR = '#4A90E2'           // 좌/우 동일 (§3-5)

export const COLORS = {
  sky: 0x87CEEB,
  road: 0xE8D9B5,
  grass: 0x7CB342,
  laneDash: 0xFFFFFF,
  body: 0x4A90E2,
  skin: 0xFFDBAC,
  pants: 0x1a3a5c,
  trunk: 0x6B4423,
  leaf: 0x2E7D32,
}
