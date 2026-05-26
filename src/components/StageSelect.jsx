import { STAGES, STAGE_COUNT } from '../game/stages.js'
import { unlockedStages } from '../lib/storage.js'

function Stars({ filled, total = 3 }) {
  const items = []
  for (let i = 0; i < total; i++) {
    items.push(<span key={i} className={i < filled ? '' : 'star-off'}>★</span>)
  }
  return <div className="stage-stars">{items}</div>
}

function StageCard({ stage, name, unlocked, stars, hasBoss, onPick }) {
  const classes = ['stage-card']
  if (!unlocked) classes.push('locked')
  else if (stars > 0) classes.push('cleared')
  if (hasBoss && unlocked) classes.push('boss')
  return (
    <button
      onClick={unlocked ? () => onPick(stage) : undefined}
      disabled={!unlocked}
      className={classes.join(' ')}
    >
      <div className="stage-number">
        {String(stage).padStart(2, '0')}
      </div>
      {hasBoss && unlocked && <div className="boss-badge">BOSS</div>}
      <div>
        {unlocked ? <Stars filled={stars} /> : <div className="stage-stars">🔒</div>}
      </div>
      <div className="stage-name">
        {unlocked ? name : '???'}
      </div>
    </button>
  )
}

export default function StageSelect({ grade, progress, onPick, onBack }) {
  const unlocked = new Set(unlockedStages(progress, grade))
  const starsMap = progress.stageStars?.[`grade${grade}`] || {}
  const acc = progress.accuracy?.[`grade${grade}`]
  const accRate = acc && acc.total > 0 ? Math.round(acc.rate * 100) : null
  const stageList = Array.from({ length: STAGE_COUNT }, (_, i) => i + 1)

  return (
    <div className="fixed inset-0 z-30" style={{ background: 'var(--bg-primary)' }}>
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/assets/images/landing-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
        }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(15,14,26,0.85), rgba(15,14,26,0.98))',
      }} />

      <div className="relative z-10 h-full flex flex-col">
        <div className="stage-select-header">
          <button onClick={onBack} className="btn-secondary" style={{ padding: '6px 10px', fontSize: 11 }}>
            ◀ 변경
          </button>
          <div className="stage-select-title">CHAPTER SELECT</div>
          <div className="accuracy-display">
            {grade}학년
            {accRate != null && <> · <strong>{accRate}%</strong></>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {stageList.map((s) => (
              <StageCard
                key={s}
                stage={s}
                name={STAGES[s]?.name}
                unlocked={unlocked.has(s)}
                stars={starsMap[s] || 0}
                hasBoss={STAGES[s]?.hasBoss}
                onPick={onPick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
