import { getWeapon, STREAK_TO_UPGRADE, MAX_WEAPON_LV } from '../game/weapons.js'
import { getStage } from '../game/stages.js'

function formatTime(sec) {
  if (sec == null) return '—'
  const s = Math.max(0, Math.floor(sec))
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

export default function HUD({ grade, score, correct, total, bossHp, bossMaxHp, phase, weaponLv = 1, streak = 0, timeRemain = null, stage = 1, paused = false, onTogglePause = null }) {
  const w = getWeapon(weaponLv)
  const rate = total > 0 ? Math.round(correct / total * 100) : null
  return <>
    <header className="battle-bar">
      <div className="battle-chapter"><b>{String(stage).padStart(2, '0')}</b><div><span>{grade}학년 · STAGE</span><strong>{getStage(stage).name}</strong></div></div>
      <div className="battle-stats">
        <div className="battle-stat"><span>점수</span><strong>{score.toLocaleString()}</strong></div>
        <div className="battle-stat accuracy-stat"><span>정답률 <small>{correct}/{total}</small></span><strong>{rate == null ? '—' : rate + '%'}</strong></div>
        <div className="battle-stat weapon-stat" title={w.name}><span>{w.name}</span><strong>Lv.{w.lv}<small>{weaponLv < MAX_WEAPON_LV ? streak + '/' + STREAK_TO_UPGRADE : 'MAX'}</small></strong></div>
      </div>
      <div className="battle-controls">
        <div className={'battle-clock' + (timeRemain != null && timeRemain <= 5 ? ' urgent' : '')}><span>남은 시간</span><strong>{formatTime(timeRemain)}</strong></div>
        {onTogglePause && <button className="battle-pause" onClick={onTogglePause} aria-label={paused ? '계속하기' : '일시정지'} title="일시정지 (ESC)">{paused ? '▶' : 'Ⅱ'}</button>}
      </div>
    </header>
    {phase === 'BOSS' && bossHp != null && <section className="battle-boss" aria-label="보스 체력">
      <div><span>BOSS · 학교폭력 우두머리</span><b>{Math.ceil(bossHp)} / {bossMaxHp}</b></div>
      <div role="progressbar" aria-label="보스 남은 체력" aria-valuenow={Math.max(0, Math.ceil(bossHp))} aria-valuemin={0} aria-valuemax={bossMaxHp}><i style={{ width: Math.max(0, bossHp / bossMaxHp * 100) + '%' }} /></div>
    </section>}
  </>
}
