export default function TacticalHUD({ tactical, phase, count }) {
  const progress = Math.round((tactical.progress || 0) * 100)
  return <div className={`tactical-hud pointer-events-none ${phase === 'BOSS' ? 'tactical-boss' : ''}`}>
    <div className="run-progress"><span>{phase === 'BOSS' ? '마지막 대결' : `학교까지 ${progress}%`}</span><div role="progressbar" aria-label="스테이지 진행" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress}%` }} /></div><span>{phase === 'BOSS' ? 'BOSS' : 'GOAL'}</span></div>
    <div className="squad-readout"><strong>👥 {count}<small>친구</small></strong><span>초당 화력 <b>{tactical.dps || 0}</b></span><span className={tactical.feverActive ? 'is-fever' : ''}>{tactical.feverActive ? '🔥 피버 중' : '🔥 피버 충전'}<i><em style={{ width: `${Math.round((tactical.fever || 0) * 100)}%` }} /></i></span></div>
    {tactical.warning ? <div className="tactical-warning" role="status">⚠ 공격 예고! 빨간 경로에서 피하세요</div> : tactical.question ? <div className="next-question"><span>다음 문제 · 약 {tactical.secondsToGate}초 후</span><strong>{tactical.question}</strong><small>정답 쪽으로 이동해 장벽을 깨세요</small></div> : null}
  </div>
}
