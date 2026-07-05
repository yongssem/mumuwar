import { useCallback, useEffect, useRef, useState } from 'react'
import { Engine, PHASE } from '../game/Engine.js'
import { commitStageResult, loadProgress, setGrade as saveGrade, setNickname as saveNickname, calcStars, setSoundEnabled } from '../lib/storage.js'
import { playBgm, stopBgm, setMuted } from '../game/utils/audio.js'
import HUD from './HUD.jsx'
import Clear from './Clear.jsx'
import GameOver from './GameOver.jsx'
import StartScreen from './StartScreen.jsx'
import StageSelect from './StageSelect.jsx'
import PauseMenu from './PauseMenu.jsx'
import { getStage } from '../game/stages.js'
import { getWeapon } from '../game/weapons.js'

export default function GameCanvas() {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)

  const [progress, setProgress] = useState(() => loadProgress())
  const [grade, setGrade] = useState(progress.grade || 3)
  const [nickname, setNickname] = useState(progress.nickname || '')
  const [soundOn, setSoundOn] = useState(progress.settings?.sound !== false)
  const [screen, setScreen] = useState('start') // 'start' | 'stageSelect' | 'play'
  const [stage, setStage] = useState(1)

  const [runKey, setRunKey] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const [count, setCount] = useState(5)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState(PHASE.PLAYING)
  const [boss, setBoss] = useState({ hp: null, max: null })
  const [answers, setAnswers] = useState({ correct: 0, total: 0 })
  const [weapon, setWeapon] = useState({ lv: 1, streak: 0 })
  const [weaponToast, setWeaponToast] = useState(null)
  const [time, setTime] = useState({ remain: null, total: null })
  const [result, setResult] = useState(null)
  const [paused, setPaused] = useState(false)
  const [combo, setCombo] = useState({ count: 0, mult: 1 })
  const [fever, setFever] = useState(false)
  const [countdown, setCountdown] = useState(null) // 3|2|1|0(GO)|null
  const [bossBanner, setBossBanner] = useState(false)

  useEffect(() => {
    if (screen !== 'play') return
    const engine = new Engine(canvasRef.current, {
      grade,
      stage,
      nickname,
      onFirstInput: () => setShowHint(false),
      onCountChange: (n) => setCount(n),
      onScoreChange: (s) => setScore(s),
      onBossHpChange: (hp, max) => setBoss({ hp, max }),
      onGateAnswer: (r) => {
        setAnswers((prev) => ({
          correct: prev.correct + (r.correct ? 1 : 0),
          total: prev.total + 1,
        }))
      },
      onWeaponChange: (lv) => {
        setWeapon((prev) => ({ lv, streak: 0 }))
        const w = getWeapon(lv)
        setWeaponToast({ id: Date.now(), text: `${w.emoji} Lv${w.lv} ${w.name}!` })
      },
      onStreakChange: (s) => {
        setWeapon((prev) => ({ ...prev, streak: s }))
      },
      onTimeChange: (remain, total) => {
        setTime({ remain, total })
      },
      onComboChange: (count, mult) => {
        setCombo({ count, mult })
      },
      onFeverChange: (on) => {
        setFever(on)
      },
      onCountdownChange: (sec) => {
        setCountdown(sec)
        if (sec === 0) setTimeout(() => setCountdown(null), 700)
      },
      onPhaseChange: (p, snapshot) => {
        setPhase(p)
        if (p === PHASE.BOSS) {
          setBossBanner(true)
          setTimeout(() => setBossBanner(false), 2200)
        }
        if (p === PHASE.CLEAR || p === PHASE.GAMEOVER) {
          const cleared = p === PHASE.CLEAR
          // 최신 answers를 functional updater로 캡처
          setAnswers((current) => {
            const prev = loadProgress()
            const prevHigh = prev.highScore || 0
            // 정답률 100% 클리어 = PERFECT 보너스 +300
            const perfect = cleared && current.total > 0 && current.correct === current.total
            const finalScore = snapshot.score + (perfect ? 300 : 0)
            const next = commitStageResult(grade, stage, {
              score: finalScore,
              correct: current.correct,
              total: current.total,
              cleared,
            })
            const rate = current.total > 0 ? current.correct / current.total : 0
            setProgress(next)
            setResult({
              cleared,
              score: finalScore,
              crowd: snapshot.crowd,
              correct: current.correct,
              total: current.total,
              stars: calcStars(cleared, rate),
              isNewHigh: finalScore > prevHigh,
              perfect,
            })
            return current
          })
        }
      },
    })
    engineRef.current = engine
    engine.start()
    return () => {
      engine.dispose()
      engineRef.current = null
    }
  }, [runKey, screen, grade, stage])

  const resetState = useCallback(() => {
    setShowHint(true)
    setCount(5)
    setScore(0)
    setPhase(PHASE.PLAYING)
    setBoss({ hp: null, max: null })
    setAnswers({ correct: 0, total: 0 })
    setWeapon({ lv: 1, streak: 0 })
    setWeaponToast(null)
    setTime({ remain: null, total: null })
    setResult(null)
    setPaused(false)
    setCombo({ count: 0, mult: 1 })
    setFever(false)
    setCountdown(null)
    setBossBanner(false)
    setRunKey((k) => k + 1)
  }, [])

  const handleStart = useCallback((name) => {
    saveGrade(grade)
    const saved = saveNickname(name)
    setNickname(saved.nickname)
    setProgress(saved)
    setScreen('stageSelect')
  }, [grade])

  const pickStage = useCallback((s) => {
    setStage(s)
    setScreen('play')
    resetState()
  }, [resetState])

  const retry = useCallback(() => {
    resetState()
  }, [resetState])

  const goHome = useCallback(() => {
    // 결과 화면에서 메뉴 = 스테이지 선택으로
    setScreen('stageSelect')
    setResult(null)
    // 최신 진행도 다시 로드
    setProgress(loadProgress())
  }, [])

  const backToStart = useCallback(() => {
    setScreen('start')
  }, [])

  const togglePause = useCallback(() => {
    setPaused((prev) => !prev)
  }, [])

  const resumeGame = useCallback(() => setPaused(false), [])

  const retryFromPause = useCallback(() => {
    setPaused(false)
    resetState()
  }, [resetState])

  const homeFromPause = useCallback(() => {
    setPaused(false)
    setScreen('stageSelect')
    setResult(null)
    setProgress(loadProgress())
  }, [])

  // Engine에 paused 상태 반영
  useEffect(() => {
    engineRef.current?.setPaused(paused)
  }, [paused])

  // ESC 키 — 게임 중에만 토글 (결과창이 떠 있을 때는 무시)
  useEffect(() => {
    if (screen !== 'play') return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (result) return // 결과 표시 중엔 ESC 무시
      if (phase === PHASE.CLEAR || phase === PHASE.GAMEOVER) return
      e.preventDefault()
      setPaused((prev) => !prev)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, result, phase])

  useEffect(() => {
    if (!weaponToast) return
    const id = setTimeout(() => setWeaponToast(null), 1800)
    return () => clearTimeout(id)
  }, [weaponToast])

  // 초기 음소거 상태 동기화
  useEffect(() => { setMuted(!soundOn) }, [soundOn])

  // 화면별 BGM 전환
  useEffect(() => {
    if (screen === 'start' || screen === 'stageSelect') {
      playBgm('menu')
    } else if (screen === 'play') {
      if (phase === PHASE.BOSS) playBgm('boss')
      else if (phase === PHASE.PLAYING) playBgm('main')
    }
  }, [screen, phase])

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev
      setSoundEnabled(next)
      return next
    })
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Phase 8.15: 인게임 배경 (학원가 야경) — 캔버스 뒤 레이어 */}
      <div className="ingame-bg" />
      <canvas
        ref={canvasRef}
        className="relative block w-full h-full"
        style={{ zIndex: 1 }}
      />
      {/* 하단 그라데이션 — 길/캐릭터가 배경에 묻히지 않도록 */}
      <div className="ingame-bottom-fade" />

      {screen === 'play' && (
        <>
          <HUD
            nickname={nickname}
            grade={grade}
            score={score}
            count={count}
            correct={answers.correct}
            total={answers.total}
            bossHp={boss.hp}
            bossMaxHp={boss.max}
            phase={phase}
            weaponLv={weapon.lv}
            streak={weapon.streak}
            timeRemain={time.remain}
            stage={stage}
            paused={paused}
            onTogglePause={(!result && phase !== PHASE.CLEAR && phase !== PHASE.GAMEOVER) ? togglePause : null}
          />

          {weaponToast && (
            <div key={weaponToast.id}
                 className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl bg-ddak-accent text-white text-sm sm:text-xl font-bold shadow-2xl animate-bounce max-w-[90vw] text-center">
              ⚡ 무기 업그레이드! {weaponToast.text}
            </div>
          )}

          {/* 시작 카운트다운 — 3·2·1·GO */}
          {countdown != null && (
            <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
              <div key={countdown} className={countdown === 0 ? 'countdown-num countdown-go' : 'countdown-num'}>
                {countdown === 0 ? 'GO!' : countdown}
              </div>
            </div>
          )}

          {/* 콤보 카운터 — 2콤보부터 표시 */}
          {combo.count >= 2 && !result && (
            <div className="pointer-events-none fixed left-1/2 -translate-x-1/2 z-20 combo-wrap">
              <div key={combo.count} className={['combo-counter', fever ? 'fever' : ''].join(' ')}>
                <span className="combo-x">×</span>{combo.count}
                <span className="combo-label">COMBO</span>
                <span className="combo-mult">{combo.mult.toFixed(1)}배</span>
              </div>
            </div>
          )}

          {/* 피버 모드 — 골드 비네트 + 라벨 */}
          {fever && !result && (
            <>
              <div className="pointer-events-none fixed inset-0 z-10 fever-vignette" />
              <div className="pointer-events-none fixed top-[22%] left-1/2 -translate-x-1/2 z-20 fever-label">
                🔥 FEVER ×2
              </div>
            </>
          )}

          {/* 보스 등장 경고 배너 */}
          {bossBanner && (
            <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
              <div className="boss-warn-banner">
                ⚠️ BOSS 등장 ⚠️
              </div>
            </div>
          )}

          {showHint && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-10 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-black/60 text-white text-[11px] sm:text-[13px] animate-pulse pointer-events-none whitespace-nowrap">
              👉 정답 쪽으로 드래그
            </div>
          )}

          {/* Phase 8.14: 일시정지 버튼은 HUD에 통합됨 (이전 떠다니는 버튼 제거) */}

          {paused && !result && (
            <PauseMenu
              onResume={resumeGame}
              onRetry={retryFromPause}
              onHome={homeFromPause}
            />
          )}

          {result?.cleared && (
            <Clear
              stage={stage}
              stageName={getStage(stage).name}
              score={result.score}
              crowd={result.crowd}
              stars={result.stars}
              correct={result.correct}
              total={result.total}
              isNewHigh={result.isNewHigh}
              perfect={result.perfect}
              onRetry={retry}
              onHome={goHome}
            />
          )}
          {result && !result.cleared && (
            <GameOver score={result.score} onRetry={retry} onHome={goHome} />
          )}
        </>
      )}

      {screen === 'start' && (
        <StartScreen
          selectedGrade={grade}
          highScore={progress.highScore || 0}
          soundOn={soundOn}
          nickname={nickname}
          onToggleSound={toggleSound}
          onPick={setGrade}
          onStart={handleStart}
        />
      )}

      {screen === 'stageSelect' && (
        <StageSelect
          grade={grade}
          progress={progress}
          onPick={pickStage}
          onBack={backToStart}
        />
      )}
    </div>
  )
}
