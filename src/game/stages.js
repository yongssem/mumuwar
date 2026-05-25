// GAME_DESIGN v2.3 §7-1 + §10-4 — 10스테이지 + 테마
// Phase 8.0-A에 맞춰 적 수 대폭 증가 (떼거리 학살)

// Phase 8.7: Hades/NecroDancer 다크 톤 통일 — 모든 테마 다크 인디고 베이스
export const THEMES = {
  ACADEMY: { bg: 0x1A1830, road: 0x2A2640, grass: 0x0F0E1A, fogNear: 15, fogFar: 60 },
  SUNSET:  { bg: 0x2A1830, road: 0x3A1F2E, grass: 0x150A1A, fogNear: 15, fogFar: 58 },
  CYBER:   { bg: 0x1A0F3A, road: 0x2A1F4D, grass: 0x0A0820, fogNear: 14, fogFar: 55 },
  ARCADE:  { bg: 0x0F1538, road: 0x202A45, grass: 0x05081A, fogNear: 14, fogFar: 55 },
  ROOFTOP: { bg: 0x080820, road: 0x1A2030, grass: 0x000010, fogNear: 12, fogFar: 50 },
}

// v2.3 — duration 추가 (초). enemies는 큐로 무한 순환.
// duration 도달 시 보스 등장 (hasBoss) 또는 클리어 라인.
export const STAGES = {
  1:  { name: '학원가 입구', theme: 'ACADEMY', duration: 45, enemies: [{ type: 'HOMEWORK', count: 5 }], hasBoss: false },
  2:  { name: '학원가 골목', theme: 'ACADEMY', duration: 60, enemies: [{ type: 'HOMEWORK', count: 5 }], hasBoss: false },
  3:  { name: '학원가 정상', theme: 'ACADEMY', duration: 70, enemies: [{ type: 'HOMEWORK', count: 5 }], hasBoss: true  },
  4:  { name: '시험지 폭풍', theme: 'SUNSET',  duration: 70, enemies: [{ type: 'NAG', count: 5 }], hasBoss: false },
  5:  { name: '잔소리 광장', theme: 'SUNSET',  duration: 85, enemies: [{ type: 'NAG', count: 4 }, { type: 'HOMEWORK', count: 2 }], hasBoss: true  },
  6:  { name: '사이버 공간', theme: 'CYBER',   duration: 85, enemies: [{ type: 'TROLL', count: 5 }], hasBoss: false },
  7:  { name: '단톡방 던전', theme: 'CYBER',   duration: 100, enemies: [{ type: 'TROLL', count: 4 }, { type: 'NAG', count: 3 }], hasBoss: true  },
  8:  { name: '게임센터',    theme: 'ARCADE',  duration: 90, enemies: [{ type: 'ZOMBIE', count: 5 }], hasBoss: false },
  9:  { name: '옥상 입구',   theme: 'ARCADE',  duration: 105, enemies: [{ type: 'ZOMBIE', count: 4 }, { type: 'TROLL', count: 3 }], hasBoss: true  },
  10: { name: '학교 옥상',   theme: 'ROOFTOP', duration: 120, enemies: [
        { type: 'HOMEWORK', count: 2 },
        { type: 'NAG', count: 3 },
        { type: 'TROLL', count: 3 },
        { type: 'ZOMBIE', count: 2 },
      ], hasBoss: true },
}

export const STAGE_COUNT = 10

export function getStage(stage) {
  return STAGES[stage] || STAGES[1]
}

export function getTheme(stage) {
  const def = getStage(stage)
  return THEMES[def.theme] || THEMES.ACADEMY
}
