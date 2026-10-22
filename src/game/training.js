import { CROWD_START } from './config.js'
import { getWeapon } from './weapons.js'

export const TRAINING = [
  { id: 'friends', name: '친구 모집', icon: '👥', description: '시작 친구 +4명', baseCost: 60 },
  { id: 'power', name: '문구 훈련', icon: '✏️', description: '화력 +10%', baseCost: 80 },
  { id: 'recruit', name: '응원 연습', icon: '📣', description: '정답 보상 +2명', baseCost: 60 },
]
export const MAX_TRAINING = 5
export function trainingLevel(training, id) {
  const n = Number(training?.[id])
  return Number.isFinite(n) ? Math.min(MAX_TRAINING, Math.max(0, Math.floor(n))) : 0
}
export function trainingCost(training, id) {
  const item = TRAINING.find((t) => t.id === id)
  return item ? item.baseCost + trainingLevel(training, id) * 40 : Infinity
}
export function trainingStats(training) {
  return {
    friends: CROWD_START + trainingLevel(training, 'friends') * 4,
    power: 1 + trainingLevel(training, 'power') * 0.1,
    recruit: trainingLevel(training, 'recruit') * 2,
  }
}
// HUD와 실제 사격이 같은 공식을 사용한다.
export function volleyStats(count, level, power = 1, fever = false) {
  const w = getWeapon(level)
  const shots = Math.max(w.shots, Math.min(30, Math.floor((count + 1) * 0.2)))
  const baseDamage = Math.max(1, Math.round(w.damage * Math.sqrt(count + 1)))
  const perBullet = Math.max(1, Math.round(baseDamage / shots)) * power
  const cooldown = fever ? Math.max(4, Math.round(w.cooldown / 2)) : w.cooldown
  return { shots, perBullet, cooldown, dps: Math.round(shots * perBullet * 60 / cooldown) }
}
export function earnedCoins({ score, correct, cleared }) {
  return 10 + Math.min(100, Math.floor(Math.max(0, score) / 100)) + Math.max(0, correct) * 5 + (cleared ? 30 : 0)
}
