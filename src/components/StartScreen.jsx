import { SUPPORTED_GRADES } from '../game/utils/problems.js'

export default function StartScreen({ selectedGrade, highScore, soundOn, onToggleSound, onPick, onStart }) {
  return <main className="launch-screen">
    <div className="launch-backdrop" />
    <div className="launch-shade" />
    <div className="launch-brand"><span className="brand-mark">無</span><span>무궁무진클래스<small>PLAY & LEARN</small></span></div>
    <button className="sound-switch" onClick={onToggleSound} aria-label={soundOn ? '사운드 끄기' : '사운드 켜기'} aria-pressed={soundOn}>{soundOn ? '♪' : '♫'}<span>사운드 {soundOn ? 'ON' : 'OFF'}</span></button>
    <section className="launch-panel">
      <span className="launch-kicker"><i /> 우리 반의 방과 후 모험</span>
      <h1>무궁무진 <span>워</span><small>MUMU WAR</small></h1>
      <p>정답을 찾아 친구를 모으고,<br />우리 학교를 지켜라!</p>
      <div className="launch-prep">
        <div className="launch-prep-heading"><label id="grade-label">몇 학년인가요?</label><span>학년에 맞는 문제가 나와요</span></div>
        <div className="launch-grades" role="group" aria-labelledby="grade-label">
          {SUPPORTED_GRADES.map((g) => <button key={g} className={g === selectedGrade ? 'selected' : ''} aria-pressed={g === selectedGrade} onClick={() => onPick(g)}><strong>{g}</strong><span>학년</span></button>)}
        </div>
        <button className="launch-go" onClick={onStart}><span>게임 시작<small>친구들과 함께 출동!</small></span><b aria-hidden="true">↗</b></button>
        <div className="launch-meta"><span>드래그 · 방향키로 이동</span><span>최고 기록 <b>{highScore.toLocaleString()}</b></span></div>
      </div>
    </section>
  </main>
}
