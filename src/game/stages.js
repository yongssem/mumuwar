// GAME_DESIGN v2.3 §7-1 + §10-4 — 10스테이지 + 테마
// Phase 8.0-A에 맞춰 적 수 대폭 증가 (떼거리 학살)

export const THEMES = {
  ACADEMY: { bg: 0x87CEEB, road: 0xE8D9B5, grass: 0x7CB342, fogNear: 30, fogFar: 80 },
  SUNSET:  { bg: 0xFFB74D, road: 0xE8D9B5, grass: 0xA1887F, fogNear: 28, fogFar: 78 },
  CYBER:   { bg: 0x311B92, road: 0x5D4037, grass: 0x283593, fogNear: 22, fogFar: 65 },
  ARCADE:  { bg: 0x1A237E, road: 0x424242, grass: 0x000051, fogNear: 22, fogFar: 65 },
  ROOFTOP: { bg: 0x000051, road: 0x37474F, grass: 0x212121, fogNear: 20, fogFar: 60 },
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
