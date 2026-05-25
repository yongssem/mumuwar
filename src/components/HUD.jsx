import { getWeapon, STREAK_TO_UPGRADE, MAX_WEAPON_LV } from '../game/weapons.js'
import { getStage } from '../game/stages.js'

export default function HUD({
  grade, score, count, highScore,
  correct, total,
  bossHp, bossMaxHp, phase,
  weaponLv = 1, streak = 0,
  timeRemain = null, timeTotal = null,
  stage = 1,
}) {
  const w = getWeapon(weaponLv)
  const rate = total > 0 ? Math.round((correct / total) * 100) : null
  const stageDef = getStage(stage)
  const timeUrgent = timeRemain != null && timeRemain <= 5

  return (
    <>
      {/* 좌상단 패널 */}
      <div className="hud-panel" style={{
        position: 'fixed', top: 16, left: 16, minWidth: 240, zIndex: 10,
      }}>
        <div className="hud-title">
          <span>⚔</span>
          <span>무궁무진 워</span>
        </div>

        <div className="hud-stat">
          <span style={{ color: 'var(--accent-gold)' }}>⚡</span>
          <span className="stat-value">{score.toLocaleString()}</span>
          {highScore > 0 && <span className="stat-best">최고 {highScore.toLocaleString()}</span>}
        </div>

        <div className="hud-stat">
          <span>📐</span>
          <span>{grade}학년 · 정답률 {rate != null ? `${rate}% (${correct}/${total})` : '—'}</span>
        </div>

        <div className="hud-stat">
          <span>{w.emoji}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            Lv{w.lv} {w.name}
          </span>
          {weaponLv < MAX_WEAPON_LV && (
            <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 4 }}>
              {streak}/{STREAK_TO_UPGRADE}
            </span>
          )}
        </div>

        <hr className="divider-thin" />

        <div className="stage-tag">
          <span>STAGE</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{String(stage).padStart(2, '0')}</span>
          <span>· {stageDef.name}</span>
        </div>
      </div>

      {/* 우상단: 인원 + 시간 */}
      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
      }}>
        <div className="hud-panel">
          <div className="crowd-count">
            <span className="crowd-label">CROWD</span>
            <span className="crowd-value">{count}</span>
          </div>
        </div>
        {timeRemain != null && (
          <div className={['time-tag', timeUrgent ? 'urgent' : ''].join(' ')}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, letterSpacing: '0.18em' }}>TIME</span>
            <span>{timeRemain}</span>
          </div>
        )}
      </div>

      {/* 보스 체력바 */}
      {phase === 'BOSS' && bossHp != null && (
        <div className="boss-hp-wrap" style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, width: 320, maxWidth: '80vw',
        }}>
          <div className="boss-hp-label">👊 학교폭력 우두머리</div>
          <div className="boss-hp-bar">
            <div className="boss-hp-fill" style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }} />
          </div>
          <div style={{
            textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-primary)', marginTop: 2,
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
          }}>
            {bossHp} / {bossMaxHp}
          </div>
        </div>
      )}
    </>
  )
}
