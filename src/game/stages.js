// GAME_DESIGN v2.3 §7-1 + §10-4 — 10스테이지 + 테마
// Phase 8.0-A에 맞춰 적 수 대폭 증가 (떼거리 학살)

// Phase 8.12: Hades 다크 톤 + 가독성 — bg/road 보라 살리고, 안개는 가까이 시작
// 게이트/적이 25유닛 안에 들어오면 또렷이 보이고, 50유닛 너머는 분위기로 사라짐.
export const THEMES = {
  ACADEMY: { bg: 0x1A1840, road: 0x3A3050, grass: 0x0F0E1A, fogNear: 25, fogFar: 50 },
  SUNSET:  { bg: 0x2A1838, road: 0x40253A, grass: 0x150A1A, fogNear: 25, fogFar: 50 },
  CYBER:   { bg: 0x1A0F48, road: 0x352560, grass: 0x0A0820, fogNear: 25, fogFar: 50 },
  ARCADE:  { bg: 0x121C48, road: 0x28365A, grass: 0x05081A, fogNear: 25, fogFar: 50 },
  ROOFTOP: { bg: 0x0C0C30, road: 0x222840, grass: 0x000010, fogNear: 22, fogFar: 48 },
}

// v2.3 — duration 추가 (초). enemies는 큐로 무한 순환.
// duration 도달 시 보스 등장 (hasBoss) 또는 클리어 라인.
//
// Phase 9.0 — difficulty 4축 스케일링:
//  · spawnInterval: 스폰 간격 (초). 작을수록 자주.
//  · spawnCount:    한 번 스폰에 나오는 적 수
//  · hpMul:         적 HP 배수 (변종 위에 추가로 곱)
//  · speedMul:      적 속도 배수
//  · eliteRate:     엘리트 변종 확률 (0~1)
//  · bossRate:      보스급 변종 확률 (0~1, eliteRate보다 작아야 정상 분포)
export const STAGES = {
  1:  { name: '학원가 입구', theme: 'ACADEMY', duration: 45,  enemies: [{ type: 'HOMEWORK', count: 5 }], hasBoss: false,
        difficulty: { spawnInterval: 1.5, spawnCount: 1, hpMul: 1.0, speedMul: 1.0,  eliteRate: 0.00, bossRate: 0 } },
  2:  { name: '학원가 골목', theme: 'ACADEMY', duration: 60,  enemies: [{ type: 'HOMEWORK', count: 5 }], hasBoss: false,
        difficulty: { spawnInterval: 1.4, spawnCount: 1, hpMul: 1.0, speedMul: 1.0,  eliteRate: 0.00, bossRate: 0 } },
  3:  { name: '학원가 정상', theme: 'ACADEMY', duration: 70,  enemies: [{ type: 'HOMEWORK', count: 5 }], hasBoss: true,
        difficulty: { spawnInterval: 1.3, spawnCount: 1, hpMul: 1.2, speedMul: 1.05, eliteRate: 0.05, bossRate: 0 } },
  4:  { name: '시험지 폭풍', theme: 'SUNSET',  duration: 70,  enemies: [{ type: 'NAG', count: 5 }], hasBoss: false,
        difficulty: { spawnInterval: 1.2, spawnCount: 2, hpMul: 1.5, speedMul: 1.10, eliteRate: 0.10, bossRate: 0 } },
  5:  { name: '잔소리 광장', theme: 'SUNSET',  duration: 85,  enemies: [{ type: 'NAG', count: 4 }, { type: 'HOMEWORK', count: 2 }], hasBoss: true,
        difficulty: { spawnInterval: 1.1, spawnCount: 2, hpMul: 1.8, speedMul: 1.15, eliteRate: 0.15, bossRate: 0 } },
  6:  { name: '사이버 공간', theme: 'CYBER',   duration: 85,  enemies: [{ type: 'TROLL', count: 5 }], hasBoss: false,
        difficulty: { spawnInterval: 1.0, spawnCount: 2, hpMul: 2.2, speedMul: 1.20, eliteRate: 0.20, bossRate: 0 } },
  7:  { name: '단톡방 던전', theme: 'CYBER',   duration: 100, enemies: [{ type: 'TROLL', count: 4 }, { type: 'NAG', count: 3 }], hasBoss: true,
        difficulty: { spawnInterval: 1.0, spawnCount: 3, hpMul: 3.0, speedMul: 1.30, eliteRate: 0.30, bossRate: 0 } },
  8:  { name: '게임센터',    theme: 'ARCADE',  duration: 90,  enemies: [{ type: 'ZOMBIE', count: 5 }], hasBoss: false,
        difficulty: { spawnInterval: 0.9, spawnCount: 3, hpMul: 3.5, speedMul: 1.35, eliteRate: 0.35, bossRate: 0.02 } },
  9:  { name: '옥상 입구',   theme: 'ARCADE',  duration: 105, enemies: [{ type: 'ZOMBIE', count: 4 }, { type: 'TROLL', count: 3 }], hasBoss: true,
        difficulty: { spawnInterval: 0.8, spawnCount: 4, hpMul: 4.0, speedMul: 1.40, eliteRate: 0.40, bossRate: 0.05 } },
  10: { name: '학교 옥상',   theme: 'ROOFTOP', duration: 120, enemies: [
        { type: 'HOMEWORK', count: 2 },
        { type: 'NAG', count: 3 },
        { type: 'TROLL', count: 3 },
        { type: 'ZOMBIE', count: 2 },
      ], hasBoss: true,
        difficulty: { spawnInterval: 0.7, spawnCount: 5, hpMul: 5.0, speedMul: 1.50, eliteRate: 0.50, bossRate: 0.10 } },
}

// 안전 기본값 (구버전 스테이지 데이터 호환)
export const DEFAULT_DIFFICULTY = {
  spawnInterval: 1.0,
  spawnCount: 1,
  hpMul: 1.0,
  speedMul: 1.0,
  eliteRate: 0,
  bossRate: 0,
}

export const STAGE_COUNT = 10

export function getStage(stage) {
  return STAGES[stage] || STAGES[1]
}

export function getTheme(stage) {
  const def = getStage(stage)
  return THEMES[def.theme] || THEMES.ACADEMY
}
