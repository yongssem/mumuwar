import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { trainingStats, trainingLevel, trainingCost, volleyStats, earnedCoins } from '../src/game/training.js'
import { loadProgress, saveProgress, buyTraining, commitStageResult } from '../src/lib/storage.js'

const data = new Map()
globalThis.localStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
beforeEach(() => data.clear())

test('기존 저장 파일에 코인과 훈련 기본값을 추가한다', () => {
  data.set('mumuwar_v2', JSON.stringify({ highScore: 1234, nickname: '용쌤' }))
  const p = loadProgress()
  assert.equal(p.highScore, 1234)
  assert.equal(p.coins, 0)
  assert.deepEqual(trainingStats(p.training), { friends: 10, power: 1, recruit: 0 })
})
test('구매는 잔액을 차감하고 영구 강화 레벨을 한 번 올린다', () => {
  saveProgress({ ...loadProgress(), coins: 100 })
  const p = buyTraining('friends')
  assert.equal(p.coins, 40)
  assert.equal(trainingStats(loadProgress().training).friends, 14)
  assert.equal(trainingCost(p.training, 'friends'), 100)
  assert.deepEqual(buyTraining('friends'), p)
  assert.deepEqual(buyTraining('invalid'), p)
})
test('훈련 상한을 넘겨 결제하지 않는다', () => {
  saveProgress({ ...loadProgress(), coins: 1000, training: { friends: 5 } })
  assert.equal(buyTraining('friends').coins, 1000)
  assert.equal(trainingLevel({ friends: 999 }, 'friends'), 5)
  assert.equal(trainingLevel({ friends: -8 }, 'friends'), 0)
  assert.equal(trainingLevel({ friends: 'bad' }, 'friends'), 0)
})
test('10% 화력 강화는 낮은 무기 레벨에서도 실제 탄환 데미지를 올린다', () => {
  const base = volleyStats(14, 1)
  const upgraded = volleyStats(14, 1, 1.1)
  assert.equal(upgraded.perBullet, base.perBullet * 1.1)
  assert.ok(upgraded.dps > base.dps)
  assert.ok(volleyStats(14, 1, 1, true).dps > base.dps)
})
test('결과 보상과 기존 별점 및 잠금 해제를 함께 저장한다', () => {
  const p = commitStageResult(3, 1, { score: 1000, correct: 4, total: 4, cleared: true })
  assert.equal(p.coins, 70)
  assert.equal(p.totalPlays, 1)
  assert.equal(p.stageStars.grade3[1], 3)
  assert.deepEqual(p.stagesUnlocked.grade3, [1, 2])
  assert.equal(earnedCoins({ score: 0, correct: 0, cleared: false }), 10)
})
test('저장 파일이 없을 때 서로 다른 기본 진행도를 공유하지 않는다', () => {
  const p = loadProgress()
  p.accuracy.grade3 = { total: 99 }
  assert.deepEqual(loadProgress().accuracy, {})
})
