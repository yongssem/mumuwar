function Stars({ filled, total = 3 }) {
  const items = []
  for (let i = 0; i < total; i++) {
    items.push(<span key={i} className={i < filled ? '' : 'star-off'}>★</span>)
  }
  return <div className="result-stars">{items}</div>
}

export default function Clear({ stage, stageName, score, crowd, stars, correct, total, isNewHigh, onRetry, onHome }) {
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0
  return (
    <div className="modal-overlay">
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
        <div className="result-screen result-clear w-full max-w-[440px]">
          <div className="modal-accent-top" />

          <h2 className="result-title">VICTORY</h2>
          <p className="result-stage">STAGE {String(stage).padStart(2, '0')} · {stageName}</p>

          <Stars filled={stars} />

          <div className="result-stats">
            <div className="result-stat">
              <div className="label">SCORE</div>
              <div className="value">{score.toLocaleString()}</div>
              {isNewHigh && <span className="badge">BEST</span>}
            </div>
            <div className="result-stat">
              <div className="label">ACCURACY</div>
              <div className="value">{rate}%</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {correct}/{total}
              </div>
            </div>
            <div className="result-stat">
              <div className="label">CROWD</div>
              <div className="value">{crowd}</div>
            </div>
          </div>

          <div className="result-buttons">
            <button onClick={onHome} className="btn-secondary" style={{ flex: 1 }}>메뉴</button>
            <button onClick={onRetry} className="btn-primary" style={{ flex: 2 }}>다음 ▶</button>
          </div>

          <div className="modal-accent-bottom" />
        </div>
      </div>
    </div>
  )
}
