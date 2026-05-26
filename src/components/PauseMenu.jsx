export default function PauseMenu({ onResume, onRetry, onHome }) {
  return (
    <div className="modal-overlay" onClick={onResume}>
      <div
        className="fixed inset-0 z-[101] flex items-center justify-center p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="result-screen w-full max-w-[380px]">
          <div className="modal-accent-top" />

          <h2 className="result-title" style={{ fontSize: 36 }}>PAUSED</h2>
          <p className="result-stage">잠시 멈춤</p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: 28,
          }}>
            <button onClick={onResume} className="btn-primary-large">
              계속하기 <span style={{ marginLeft: 6 }}>▶</span>
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onRetry} className="btn-secondary" style={{ flex: 1 }}>
                다시하기
              </button>
              <button onClick={onHome} className="btn-secondary" style={{ flex: 1 }}>
                메뉴
              </button>
            </div>
          </div>

          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.2em',
            textAlign: 'center',
            marginTop: 20,
          }}>
            ESC 또는 바깥 클릭으로 계속
          </p>

          <div className="modal-accent-bottom" />
        </div>
      </div>
    </div>
  )
}
