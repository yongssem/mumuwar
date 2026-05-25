export const ROAD_WIDTH = 8
export const ROAD_LENGTH = 200

export const PLAYER_SPEED = 0.12
export const DRAG_SENSITIVITY = 12
export const PLAYER_SMOOTH = 0.15

// 학년별 속도 배율 — 낮은 학년일수록 천천히 (문제 읽을 시간 확보)
// 3학년 = 1.0 기준
export const GRADE_SPEED_MULT = {
  1: 0.45,
  2: 0.60,
  3: 0.82,
  4: 0.72,
  5: 0.65,
  6: 0.58,
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

// Phase 8.7: Hades/NecroDancer 다크 톤 통일
export const COLORS = {
  sky: 0x1A1830,       // 다크 인디고
  road: 0x2A2640,      // 검보라
  roadEmissive: 0x1A1638,
  grass: 0x0F0E1A,     // 거의 검정
  laneDash: 0xFFC107,  // 골드 액센트
  body: 0x4A90E2,      // 리더 본체 (모자 식별용으로 유지)
  skin: 0xE0BC8C,      // 채도 낮춤
  pants: 0x1a1530,     // 다크 인디고
  trunk: 0x4A148C,     // 다크 퍼플
  leaf: 0x1A237E,      // 다크 인디고
  leafEmissive: 0x00BCD4, // 시안 글로우
}
