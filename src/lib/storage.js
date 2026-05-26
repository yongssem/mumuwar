// GAME_DESIGN v2 §8 — localStorage 스키마
const KEY = 'mumuwar_v2'

const DEFAULT = {
  nickname: '',
  grade: 3,
  highScore: 0,
  stagesUnlocked: {},   // { grade3: [1, 2, ...] }
  stageStars: {},       // { grade3: { 1: 3 } }
  accuracy: {},         // { grade3: { correct, total, rate } }
  weakPoints: {},       // { grade3: { '구구단_7단': 4 } }
  totalPlays: 0,
  lastPlayed: null,
  settings: { sound: true, sensitivity: 1.0 },
}

export const NICKNAME_MAX = 12

export function sanitizeNickname(raw) {
  return String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, NICKNAME_MAX)
}

const gkey = (g) => `grade${g}`

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveProgress(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch {}
}

export function setGrade(grade) {
  const p = loadProgress()
  p.grade = grade
  saveProgress(p)
  return p
}

export function setNickname(nickname) {
  const p = loadProgress()
  p.nickname = sanitizeNickname(nickname)
  saveProgress(p)
  return p
}

export function setSoundEnabled(enabled) {
  const p = loadProgress()
  p.settings = { ...p.settings, sound: !!enabled }
  saveProgress(p)
  return p
}

export function unlockedStages(progress, grade) {
  return progress.stagesUnlocked?.[gkey(grade)] || [1]
}

// 별점 (정답률 기준): 1=클리어, 2=70%+, 3=90%+
export function calcStars(cleared, accuracyRate) {
  if (!cleared) return 0
  if (accuracyRate >= 0.9) return 3
  if (accuracyRate >= 0.7) return 2
  return 1
}

export function commitStageResult(grade, stage, { score, correct, total, cleared }) {
  const p = loadProgress()
  const gk = gkey(grade)
  p.totalPlays = (p.totalPlays || 0) + 1
  p.lastPlayed = new Date().toISOString()
  if (score > (p.highScore || 0)) p.highScore = score

  // 누적 정답률
  const acc = p.accuracy[gk] || { correct: 0, total: 0, rate: 0 }
  acc.correct += correct
  acc.total += total
  acc.rate = acc.total > 0 ? acc.correct / acc.total : 0
  p.accuracy[gk] = acc

  // 별점 + 잠금해제
  const rate = total > 0 ? correct / total : 0
  const stars = calcStars(cleared, rate)
  if (cleared) {
    p.stageStars[gk] = p.stageStars[gk] || {}
    if (stars > (p.stageStars[gk][stage] || 0)) p.stageStars[gk][stage] = stars
    p.stagesUnlocked[gk] = p.stagesUnlocked[gk] || [1]
    if (!p.stagesUnlocked[gk].includes(stage + 1)) p.stagesUnlocked[gk].push(stage + 1)
  }

  saveProgress(p)
  return p
}
