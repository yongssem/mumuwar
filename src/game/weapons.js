// GAME_DESIGN v2 §5 — 무기 시스템
// 데미지 공식: damage = weapon.damage × √친구수

export const WEAPONS = [
  // v2.2.1: 쿨다운 + shots(동시 발사 수). Lv1부터 2발 spread로 첫 게이트 깰 수 있게.
  { lv: 1, name: '노트 던지기',  emoji: '📓', damage: 1,  color: 0xFFD600, cooldown: 18, shots: 2 },
  { lv: 2, name: '자 휘두르기',  emoji: '📐', damage: 2,  color: 0xFFB300, cooldown: 17, shots: 3 },
  { lv: 3, name: '연필 날리기',  emoji: '✏️', damage: 3,  color: 0xFF9800, cooldown: 11, shots: 4 },
  { lv: 4, name: '칠판지우개',   emoji: '🧹', damage: 5,  color: 0x4FC3F7, cooldown: 18, shots: 5 },
  { lv: 5, name: '사전 던지기',  emoji: '📕', damage: 10, color: 0xFFB300, cooldown: 27, shots: 6 },
]

export const MAX_WEAPON_LV = WEAPONS.length

// §5-2: 연속 정답 N회 → 자동 +1 업그레이드
export const STREAK_TO_UPGRADE = 3

export function getWeapon(lv) {
  return WEAPONS[Math.max(0, Math.min(WEAPONS.length - 1, lv - 1))]
}
