function SquadIcon() {
  return <svg viewBox="0 0 40 32" fill="currentColor" aria-hidden="true"><circle cx="20" cy="8" r="6" /><circle cx="7" cy="11" r="4" /><circle cx="33" cy="11" r="4" /><path d="M10 30v-7a10 10 0 0 1 20 0v7zM0 27v-5a7 7 0 0 1 8-7 13 13 0 0 0-2 8v4zm34 0v-4a13 13 0 0 0-2-8 7 7 0 0 1 8 7v5z" /></svg>
}

export default function TacticalHUD({ tactical, phase, count }) {
  const progress = Math.round((tactical.progress || 0) * 100)
  const fever = Math.round((tactical.fever || 0) * 100)
  return <div className="combat-overlay pointer-events-none">
    <div className="battle-route"><span>{phase === 'BOSS' ? '최종 대결' : '학교까지'}</span><div role="progressbar" aria-label="스테이지 진행" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: progress + '%' }} /></div><b>{progress}%</b><span className="route-goal">GOAL ◆</span></div>
    <aside className="question-rail" aria-label="현재 문제">
      <div className="question-eyebrow"><span className="question-dot" />{phase === 'BOSS' ? 'FINAL MISSION' : 'MATH MISSION'}</div>
      <span className="question-heading">{phase === 'BOSS' ? '학교를 지켜라!' : '정답을 향해!'}</span>
      {tactical.question ? <>
        <strong className={'question-expression' + (tactical.question.length > 16 ? ' question-long' : tactical.question.length > 10 ? ' question-medium' : '')} key={tactical.question}>{tactical.question}</strong>
        <div className="question-arrival"><span>장벽 도착</span><b>약 {tactical.secondsToGate}초</b></div>
        <p>정답 보기 쪽으로 이동해<br />장벽을 깨고 친구를 모으세요.</p>
      </> : <><strong className="question-expression">{phase === 'BOSS' ? 'BOSS' : '준비!'}</strong><p>{phase === 'BOSS' ? '빨간 공격 경로를 피하면서 자동 사격으로 보스를 물리치세요.' : '곧 문제가 나타나요. 좌우로 움직이며 준비하세요.'}</p></>}
      <div className="question-controls"><span>←</span><span>→</span><small>이동 / 드래그</small></div>
    </aside>
    <section className={'squad-dock' + (tactical.feverActive ? ' fever-on' : '')} aria-label="우리 반 전투 상태">
      <div className="squad-population"><span className="squad-emblem"><SquadIcon /></span><div><span>함께하는 친구</span><strong key={count}>{count}<small>명</small></strong></div></div>
      <div className="squad-power"><span>초당 화력</span><strong>{tactical.dps || 0}<small>POWER</small></strong></div>
      <div className="squad-fever"><div><span>{tactical.feverActive ? 'FEVER TIME' : '피버 에너지'}</span><b>{fever}%</b></div><div className="fever-track"><i style={{ width: fever + '%' }} /></div><small>{tactical.feverActive ? '지금! 화력을 쏟아부으세요' : '연속 처치로 피버를 충전하세요'}</small></div>
    </section>
    {tactical.warning && <div className="combat-warning" role="status"><b>!</b> 공격 예고 · 빨간 경로에서 피하세요</div>}
  </div>
}
