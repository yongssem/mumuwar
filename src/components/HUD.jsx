import { getWeapon, STREAK_TO_UPGRADE, MAX_WEAPON_LV } from '../game/weapons.js'
import { getStage } from '../game/stages.js'

// MM:SS 형식 (00초 이하는 0:SS)
function formatTime(sec) {
  if (sec == null) return '—'
  const s = Math.max(0, Math.floor(sec))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

export default function HUD({
  nickname = '',
  grade, score, count,
  correct, total,
  bossHp, bossMaxHp, phase,
  weaponLv = 1, streak = 0,
  timeRemain = null,
  stage = 1,
  paused = false,
  onTogglePause = null,
}) {
  const w = getWeapon(weaponLv)
  const rate = total > 0 ? Math.round((correct / total) * 100) : null
  const stageDef = getStage(stage)
  const timeUrgent = timeRemain != null && timeRemain <= 5

  return (
    <>
      {/* 좌상단 — 아바타 / 자원 카드 3종 / 스테이지 배지 */}
      <div className="hud-left">
        <div className="player-card-wrapper">
          <div className="player-avatar" aria-label="플레이어 아바타">
            <img
              src="/assets/sprites/characters/leader-yongssam-celebrate.png"
              alt=""
              draggable={false}
            />
          </div>
          <div className="player-level-badge" title={`${grade}학년`}>{grade}</div>
          {nickname && <div className="player-name-badge">{nickname}</div>}
        </div>

        <div className="resource-card" title="점수">
          <span className="res-icon">⚡</span>
          <span className="res-label">SCORE</span>
          <span className="res-value">{score.toLocaleString()}</span>
        </div>

        <div className="resource-card" title="정답률">
          <span className="res-icon">🎯</span>
          <span className="res-label">ACCURACY</span>
          <span className="res-value">{rate != null ? `${rate}%` : '—'}</span>
          {rate != null && (
            <span className="res-sub">{correct}/{total}</span>
          )}
        </div>

        <div className="resource-card" title={w.name}>
          <span className="res-icon">{w.emoji}</span>
          <span className="res-label">WEAPON</span>
          <span className="res-value">Lv {w.lv}</span>
          {weaponLv < MAX_WEAPON_LV && (
            <span className="res-sub">{streak}/{STREAK_TO_UPGRADE}</span>
          )}
        </div>

        <div className="stage-badge-large">
          <span className="badge-tag">STAGE</span>
          <span className="badge-num">{String(stage).padStart(2, '0')}</span>
          <span className="badge-name">{stageDef.name}</span>
        </div>
      </div>

      {/* 우상단 — 인원 / 시간 / 일시정지 */}
      <div className="hud-right">
        <div className="counter-card" title="군중 인원">
          <span className="counter-icon">👥</span>
          <span className="counter-value">{count}</span>
        </div>

        {timeRemain != null && (
          <div className={['counter-card', timeUrgent ? 'urgent' : ''].join(' ')} title="남은 시간">
            <span className="counter-icon">⏱️</span>
            <span className="counter-value">{formatTime(timeRemain)}</span>
          </div>
        )}

        {onTogglePause && (
          <button
            className="pause-btn"
            onClick={onTogglePause}
            aria-label={paused ? '계속하기' : '일시정지'}
            title="일시정지 (ESC)"
          >
            {paused ? '▶' : '❚❚'}
          </button>
        )}
      </div>

      {/* 보스 체력바 — 그대로 유지 */}
      {phase === 'BOSS' && bossHp != null && (
        <div className="boss-hp-wrap" style={{
          position: 'fixed', top: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, width: 280, maxWidth: '60vw',
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
