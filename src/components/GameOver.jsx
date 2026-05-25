export default function GameOver({ score, onRetry, onHome }) {
  return (
    <div className="modal-overlay">
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
        <div className="result-screen result-defeat defeat w-full max-w-[440px]">
          <div className="modal-accent-top" style={{ background: 'linear-gradient(90deg, transparent, var(--color-danger), transparent)' }} />

          <h2 className="result-title">DEFEATED</h2>
          <p className="result-stage">친구들이 흩어졌어요 · 다시 도전!</p>

          <div className="result-stats" style={{ justifyContent: 'center' }}>
            <div className="result-stat">
              <div className="label">획득 점수</div>
              <div className="value" style={{ color: 'var(--color-danger)' }}>{score.toLocaleString()}</div>
            </div>
          </div>

          <div className="result-buttons">
            <button onClick={onHome} className="btn-secondary" style={{ flex: 1 }}>메뉴</button>
            <button onClick={onRetry} className="btn-primary" style={{ flex: 2 }}>재시도 ↻</button>
          </div>

          <div className="modal-accent-bottom" style={{ background: 'linear-gradient(90deg, transparent, var(--color-danger), transparent)' }} />
        </div>
      </div>
    </div>
  )
}
