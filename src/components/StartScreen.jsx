import { useState } from 'react'
import { SUPPORTED_GRADES } from '../game/utils/problems.js'
import { NICKNAME_MAX, sanitizeNickname } from '../lib/storage.js'

export default function StartScreen({
  selectedGrade, highScore, soundOn,
  nickname = '',
  onToggleSound, onPick, onStart,
}) {
  const [name, setName] = useState(nickname)
  const trimmed = sanitizeNickname(name)
  const canStart = trimmed.length > 0

  const submit = () => {
    if (!canStart) return
    onStart(trimmed)
  }

  return (
    <div className="fixed inset-0 z-30" style={{ background: 'var(--bg-primary)' }}>
      {/* Phase 8.11: 한국 학원가 야경 배경 */}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/assets/images/landing-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* 다크 그라데이션 오버레이 — 위는 살짝, 아래는 짙게 (모달 가독성 확보) */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(15,14,26,0.4) 0%, rgba(15,14,26,0.85) 100%)',
        }}
      />

      {/* 사운드 토글 */}
      <button
        onClick={onToggleSound}
        className="absolute top-5 right-5 w-12 h-12 rounded-full text-xl text-white active:scale-95 z-20"
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-default)',
          backdropFilter: 'blur(8px)',
        }}
        aria-label={soundOn ? '사운드 끄기' : '사운드 켜기'}
      >
        {soundOn ? '🔊' : '🔇'}
      </button>

      {/* 메인 모달 — 하단 정렬 (배경 이미지의 타이틀과 안 겹치게) */}
      <div className="relative z-10 h-full flex flex-col items-center justify-end px-4 pb-8">
        <div className="modal-content w-full max-w-[420px]" style={{ paddingTop: 22, paddingBottom: 22 }}>
          <div className="modal-accent-top" />

          {highScore > 0 && (
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-muted)',
              textAlign: 'center',
              letterSpacing: '0.18em',
              margin: '0 0 14px',
            }}>
              <span style={{ color: 'var(--accent-gold)' }}>⚡</span> HIGH SCORE · {highScore.toLocaleString()}
            </p>
          )}

          <div className="nickname-label">NICKNAME</div>
          <input
            className="nickname-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, NICKNAME_MAX))}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
            placeholder="닉네임을 입력하세요"
            maxLength={NICKNAME_MAX}
            autoFocus={!nickname}
            style={{ marginBottom: 14 }}
          />

          <button
            onClick={submit}
            disabled={!canStart}
            className="btn-primary-large"
            style={{
              marginBottom: 16,
              opacity: canStart ? 1 : 0.45,
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}
          >
            게임 시작 <span style={{ marginLeft: 6 }}>▶</span>
          </button>

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.25em',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            SELECT GRADE
          </div>

          <div className="grade-grid">
            {SUPPORTED_GRADES.map((g) => (
              <button
                key={g}
                onClick={() => onPick(g)}
                className={['grade-btn', g === selectedGrade ? 'active' : ''].join(' ')}
              >
                <span className="grade-number">{g}</span>
                <span className="grade-label">학년</span>
              </button>
            ))}
          </div>

          <div className="modal-accent-bottom" />
        </div>

        <footer className="game-footer" style={{ marginTop: 12 }}>
          © 2026 <a href="https://mumuclass.kr" target="_blank" rel="noreferrer">무궁무진클래스</a> · 용쌤
        </footer>
      </div>
    </div>
  )
}
