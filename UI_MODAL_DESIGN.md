# 🎨 무궁무진 워 — UI/모달 디자인 명세

> Phase 8.1: Hades/NecroDancer 톤으로 모든 UI 통일
> v1.0 · 2026-05-25

---

## 🎯 디자인 철학

> **"교실 게임"이 아닌 "진짜 게임"으로 보이게**

| 기존 (유치함의 원인) | **목표 (Hades 톤)** |
|---------------------|-------------------|
| 둥근 모서리 + 파스텔 | 각진 모서리 + 다크 톤 |
| 흰색 카드 + 검정 텍스트 | 다크 글래스 + 골드 텍스트 |
| 일반 sans-serif | 무게감 있는 폰트 + 글리치 액센트 |
| 단순 호버 효과 | 네온 글로우 + 마이크로 인터랙션 |

---

## 🎨 디자인 토큰 (CSS 변수)

`src/styles/tokens.css` 또는 Tailwind config에 추가:

```css
:root {
  /* 배경 */
  --bg-primary: #0F0E1A;       /* 메인 다크 인디고 */
  --bg-secondary: #1A1830;     /* 모달 베이스 */
  --bg-glass: rgba(26, 24, 48, 0.85);  /* 글래스 효과 */
  --bg-card: rgba(40, 35, 70, 0.7);    /* 카드 내부 */
  
  /* 액센트 */
  --accent-gold: #FFC107;      /* 메인 골드 */
  --accent-gold-glow: #FFD54F; /* 골드 글로우 */
  --accent-magenta: #C2185B;   /* 보조 마젠타 */
  --accent-cyan: #00BCD4;      /* 네온 시안 */
  --accent-purple: #7B1FA2;    /* 미디엄 퍼플 */
  
  /* 텍스트 */
  --text-primary: #FFF8E1;     /* 따뜻한 화이트 */
  --text-secondary: #B39DDB;   /* 보라빛 회색 */
  --text-muted: #6A5F8E;       /* 흐림 */
  --text-gold: #FFD54F;        /* 강조 */
  
  /* 보더/구분선 */
  --border-default: rgba(255, 193, 7, 0.3);   /* 골드 반투명 */
  --border-active: rgba(255, 213, 79, 0.8);   /* 골드 글로우 */
  --border-danger: rgba(229, 57, 53, 0.6);    /* 빨강 보스 */
  
  /* 상태 */
  --color-success: #66BB6A;
  --color-warning: #FFA726;
  --color-danger: #E53935;
  --color-locked: #424242;
}
```

### 그림자/글로우

```css
--shadow-modal: 0 12px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 193, 7, 0.2);
--glow-gold: 0 0 16px rgba(255, 213, 79, 0.4);
--glow-cyan: 0 0 16px rgba(0, 188, 212, 0.4);
--glow-danger: 0 0 16px rgba(229, 57, 53, 0.5);
```

---

## 🔤 타이포그래피

### 폰트 추가

`index.html`에 추가 (또는 npm 설치):

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Pretendard:wght@500;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```

### 폰트 역할

| 용도 | 폰트 | 비고 |
|------|------|------|
| **메인 타이틀** | `Cinzel` 900 | "무궁무진 워" 같은 큰 제목 (서양 판타지 느낌) |
| **본문/UI** | `Pretendard` 700 | 한글 가독성 + 무게감 |
| **숫자/HP** | `JetBrains Mono` 700 | "40/200" 같은 수치 |

### 폰트 사이즈

```css
--font-hero: 48px;     /* 게임 제목 */
--font-title: 32px;    /* 화면 제목 */
--font-h1: 24px;       /* 모달 헤더 */
--font-h2: 18px;       /* 섹션 헤더 */
--font-body: 14px;     /* 본문 */
--font-small: 12px;    /* 부가 정보 */
```

---

## 🪟 모달 베이스 스타일

### 공통 모달 컨테이너

```jsx
// 모든 모달이 사용하는 베이스
<div className="modal-base">
  {/* 배경 오버레이 */}
  <div className="modal-overlay" />
  
  {/* 모달 본체 */}
  <div className="modal-content">
    {/* 상단 골드 테두리 액센트 */}
    <div className="modal-accent-top" />
    
    {/* 내용 */}
    <div className="modal-body">
      ...
    </div>
    
    {/* 하단 골드 테두리 액센트 */}
    <div className="modal-accent-bottom" />
  </div>
</div>
```

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(15, 14, 26, 0.6) 0%,
    rgba(15, 14, 26, 0.95) 100%
  );
  backdrop-filter: blur(8px);
  z-index: 100;
}

.modal-content {
  background: var(--bg-glass);
  backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid var(--border-default);
  border-radius: 4px;  /* 거의 각짐 (Hades 톤) */
  padding: 32px;
  box-shadow: var(--shadow-modal);
  position: relative;
  z-index: 101;
}

/* 상하 골드 액센트 라인 */
.modal-accent-top,
.modal-accent-bottom {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--accent-gold) 30%,
    var(--accent-gold-glow) 50%,
    var(--accent-gold) 70%,
    transparent 100%
  );
}
.modal-accent-top { top: 0; }
.modal-accent-bottom { bottom: 0; }
```

---

## 🎮 화면별 디자인 명세

### 1. 시작 화면 (StartScreen.jsx)

#### 레이아웃

```
┌─────────────────────────────────────────────┐
│                                             │
│         (배경 이미지 풀스크린)               │
│         + 어두운 그라데이션 오버레이          │
│                                             │
│                                             │
│        ┌──────────────────────┐            │
│        │   무궁무진 워          │  ← 제목   │
│        │   Mumu War            │            │
│        │                       │            │
│        │ ─────────────────────│            │
│        │                       │            │
│        │  [ 게임 시작 ▶ ]     │  ← 버튼   │
│        │                       │            │
│        │  ◯ 1학년    ◯ 4학년  │            │
│        │  ◯ 2학년    ◯ 5학년  │  ← 학년   │
│        │  ◯ 3학년 ✓  ◯ 6학년  │            │
│        │                       │            │
│        └──────────────────────┘            │
│                                             │
│                                  v1.0       │
│         © 2026 무궁무진클래스 · 용쌤        │
└─────────────────────────────────────────────┘
```

#### 핵심 스타일

```jsx
<div className="start-screen">
  {/* 배경 이미지 */}
  <div style={{
    backgroundImage: 'url(/assets/images/landing-bg.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'absolute', inset: 0,
  }} />
  
  {/* 다크 오버레이 + 비네팅 */}
  <div style={{
    position: 'absolute', inset: 0,
    background: `
      radial-gradient(circle at center, transparent 30%, rgba(15,14,26,0.85) 100%),
      linear-gradient(180deg, rgba(15,14,26,0.5) 0%, rgba(15,14,26,0.95) 100%)
    `,
  }} />
  
  {/* 메인 모달 */}
  <div className="modal-content" style={{
    width: '420px',
    margin: '0 auto',
    marginTop: '15vh',
  }}>
    <h1 className="hero-title">무궁무진 워</h1>
    <p className="hero-subtitle">M U M U   W A R</p>
    
    <div className="divider" />
    
    <button className="btn-primary-large">
      게임 시작 <span>▶</span>
    </button>
    
    <div className="grade-grid">
      {[1,2,3,4,5,6].map(g => (
        <GradeButton grade={g} active={g === grade} />
      ))}
    </div>
  </div>
</div>
```

#### 제목 스타일

```css
.hero-title {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 48px;
  color: var(--text-gold);
  text-align: center;
  letter-spacing: 0.02em;
  text-shadow: 
    0 0 20px rgba(255, 213, 79, 0.6),
    0 0 40px rgba(255, 193, 7, 0.3);
  margin: 0;
}

.hero-subtitle {
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  letter-spacing: 0.4em;  /* 자간 넓게 */
  margin-top: 8px;
}

.divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--accent-gold) 50%,
    transparent 100%
  );
  margin: 24px 0;
}
```

#### 학년 선택 버튼

```jsx
<button className={`grade-btn ${active ? 'active' : ''}`}>
  <span className="grade-number">{grade}</span>
  <span className="grade-label">학년</span>
</button>
```

```css
.grade-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 20px;
}

.grade-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 12px;
  color: var(--text-secondary);
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.grade-btn:hover {
  border-color: var(--border-active);
  color: var(--text-primary);
  background: var(--bg-card);
  box-shadow: var(--glow-gold);
}

.grade-btn.active {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
  background: rgba(255, 193, 7, 0.1);
  box-shadow: var(--glow-gold);
}

.grade-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
  font-weight: 700;
}
.grade-label {
  font-size: 12px;
  letter-spacing: 0.1em;
}
```

---

### 2. 스테이지 선택 화면 (StageSelect.jsx)

#### 레이아웃

```
┌─────────────────────────────────────────────┐
│  ◀ 학년 변경                  3학년 · 67% │  ← 상단 바
├─────────────────────────────────────────────┤
│                                             │
│   STAGE  무궁무진 워 — Chapter Select       │
│                                             │
│   ┌──────┬──────┬──────┐                   │
│   │  01  │  02  │  03 │                   │
│   │ ⭐⭐⭐│ ⭐⭐  │ BOSS│  ← 스테이지 카드   │
│   │ 학원가│ 학원가│ 거인│                   │
│   └──────┴──────┴──────┘                   │
│   ┌──────┬──────┬──────┐                   │
│   │  04  │  05  │  06 │                   │
│   │      │ BOSS │  🔒 │  ← 잠금된 것은     │
│   │ 시험지│ 잔소리│  ?? │     자물쇠       │
│   └──────┴──────┴──────┘                   │
│   ...                                       │
│                                             │
└─────────────────────────────────────────────┘
```

#### 스테이지 카드 스타일

```jsx
<div className={`stage-card ${state}`}>
  {/* 좌상단: 스테이지 번호 */}
  <div className="stage-number">01</div>
  
  {/* 우상단: 보스 배지 (있을 때) */}
  {hasBoss && <div className="boss-badge">BOSS</div>}
  
  {/* 중앙: 별점 또는 자물쇠 */}
  <div className="stage-stars">
    {locked ? <Lock /> : <Stars count={stars} />}
  </div>
  
  {/* 하단: 스테이지명 */}
  <div className="stage-name">
    {locked ? '???' : stageName}
  </div>
</div>
```

```css
.stage-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 16px;
  aspect-ratio: 1;  /* 정사각형 */
  position: relative;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.stage-card:hover:not(.locked) {
  border-color: var(--border-active);
  background: rgba(255, 193, 7, 0.08);
  box-shadow: var(--glow-gold);
  transform: translateY(-2px);
}

.stage-card.locked {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--color-locked);
}

.stage-card.cleared {
  border-color: var(--accent-gold);
}

.stage-card.boss {
  border-color: var(--border-danger);
}
.stage-card.boss::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(229, 57, 53, 0.15) 0%,
    transparent 70%
  );
  pointer-events: none;
  border-radius: 4px;
}

.stage-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.boss-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--color-danger);
  color: var(--text-primary);
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 10px;
  padding: 2px 8px;
  letter-spacing: 0.15em;
  border-radius: 2px;
  box-shadow: var(--glow-danger);
}

.stage-stars {
  display: flex;
  justify-content: center;
  gap: 2px;
  font-size: 20px;
}

.stage-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}
```

#### 상단 정답률 헤더

```jsx
<div className="stage-select-header">
  <button onClick={onBack}>◀ 학년 변경</button>
  
  <div className="accuracy-display">
    <span className="grade-tag">{grade}학년</span>
    <span className="separator">·</span>
    <span className="accuracy">정답률 <strong>{accuracy}%</strong></span>
  </div>
</div>
```

```css
.stage-select-header {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-default);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.accuracy-display {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-secondary);
  font-size: 14px;
}

.accuracy strong {
  color: var(--accent-gold);
  font-size: 18px;
  margin-left: 4px;
}
```

---

### 3. 인게임 HUD (HUD.jsx)

#### 레이아웃

```
┌─────────────────────────────────────────────┐
│ 🎮 무궁무진 워        │ 인원: 30명 ▲        │ ← 좌상/우상
│ ⚡ 270 (최고 666)    │                      │
│ 📐 3학년·정답률 67% │                      │
│ ─────────────────                          │
│ ⚔ STAGE 1·학원가 입구 │                    │
│ 적 처치 1/3                                 │
│                                             │
│         (게임 화면)                         │
│                                             │
└─────────────────────────────────────────────┘
```

#### 좌상단 정보 패널

```jsx
<div className="hud-panel hud-left">
  <div className="hud-title">
    <span className="icon">🎮</span>
    <span>무궁무진 워</span>
  </div>
  
  <div className="hud-stat">
    <span className="stat-icon">⚡</span>
    <span className="stat-value">{score}</span>
    <span className="stat-best">최고 {highScore}</span>
  </div>
  
  <div className="hud-stat">
    <span className="stat-icon">📐</span>
    <span>{grade}학년 · 정답률 {accuracy}%</span>
  </div>
  
  <div className="divider-thin" />
  
  <div className="stage-tag">
    <span className="stage-tag-label">STAGE</span>
    <span className="stage-tag-num">{stageNum}</span>
    <span className="stage-tag-name">· {stageName}</span>
  </div>
</div>
```

```css
.hud-panel {
  position: fixed;
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 12px 16px;
  font-family: 'Pretendard', sans-serif;
  color: var(--text-primary);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.hud-left {
  top: 16px;
  left: 16px;
  min-width: 220px;
}

.hud-title {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--accent-gold);
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.hud-stat {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: var(--text-primary);
  font-size: 14px;
}

.stat-best {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: 6px;
}

.stage-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--accent-purple);
  color: var(--text-primary);
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 2px;
  letter-spacing: 0.1em;
}
```

#### 우상단 인원 표시

```jsx
<div className="hud-panel hud-right">
  <div className="crowd-count">
    <span className="crowd-label">인원</span>
    <span className="crowd-value">{count}</span>
    <span className="crowd-trend">{trend > 0 ? '▲' : '▼'}</span>
  </div>
</div>
```

```css
.hud-right {
  top: 16px;
  right: 16px;
}

.crowd-count {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.crowd-label {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.crowd-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 24px;
  color: var(--accent-gold);
}

.crowd-trend {
  font-size: 14px;
  color: var(--color-success);
}
```

---

### 4. 클리어/게임오버 화면

#### 클리어 (Clear.jsx)

```jsx
<div className="result-screen">
  <h2 className="result-title result-clear">VICTORY</h2>
  <p className="result-stage">STAGE {num} · {name}</p>
  
  <div className="result-stars">
    {[1,2,3].map(i => (
      <Star key={i} filled={i <= stars} />
    ))}
  </div>
  
  <div className="result-stats">
    <Stat label="친구" value={crowdSize} />
    <Stat label="점수" value={score} />
    <Stat label="정답률" value={`${accuracy}%`} />
  </div>
  
  <div className="result-buttons">
    <button className="btn-secondary" onClick={onMenu}>메뉴</button>
    <button className="btn-primary" onClick={onNext}>다음 ▶</button>
  </div>
</div>
```

```css
.result-screen {
  background: var(--bg-glass);
  backdrop-filter: blur(30px);
  border: 1px solid var(--accent-gold);
  border-radius: 4px;
  padding: 48px 64px;
  text-align: center;
  box-shadow: 
    0 24px 72px rgba(0, 0, 0, 0.6),
    var(--glow-gold);
}

.result-title {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 56px;
  letter-spacing: 0.15em;
  margin: 0;
}

.result-clear {
  color: var(--accent-gold);
  text-shadow: var(--glow-gold);
}

.result-stage {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-secondary);
  font-size: 14px;
  letter-spacing: 0.2em;
  margin-top: 8px;
}

.result-stars {
  font-size: 48px;
  margin: 32px 0;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.result-stats {
  display: flex;
  justify-content: space-around;
  margin: 32px 0;
  padding: 16px 0;
  border-top: 1px solid var(--border-default);
  border-bottom: 1px solid var(--border-default);
}

.result-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
```

#### 게임오버 (GameOver.jsx)

기본 구조 동일하되:
- `result-title` → "DEFEATED" 표시
- 색상: 빨강 (`--color-danger`)
- 글로우: `--glow-danger`
- 버튼: "메뉴" / "재시도 ↻"

---

### 5. 버튼 베이스 스타일

```css
.btn-primary,
.btn-primary-large {
  background: linear-gradient(
    135deg,
    var(--accent-gold) 0%,
    #FFA000 100%
  );
  color: #1A0E00;
  border: none;
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 12px 24px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 
    0 4px 12px rgba(255, 193, 7, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
}

.btn-primary-large {
  padding: 16px 32px;
  font-size: 16px;
  width: 100%;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 
    0 6px 16px rgba(255, 193, 7, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--border-active);
  color: var(--text-primary);
  box-shadow: var(--glow-gold);
}
```

---

### 6. 푸터

```jsx
<footer className="game-footer">
  © 2026 <a href="https://mumuclass.kr">무궁무진클래스</a> · 용쌤
</footer>
```

```css
.game-footer {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.game-footer a {
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 1px dotted var(--text-muted);
}

.game-footer a:hover {
  color: var(--accent-gold);
  border-bottom-color: var(--accent-gold);
}
```

---

## ✨ 마이크로 인터랙션

### 호버 글로우 애니메이션

```css
@keyframes goldPulse {
  0%, 100% { box-shadow: 0 0 16px rgba(255, 213, 79, 0.3); }
  50% { box-shadow: 0 0 24px rgba(255, 213, 79, 0.6); }
}

.stage-card.boss .boss-badge {
  animation: dangerPulse 2s ease-in-out infinite;
}

@keyframes dangerPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(229, 57, 53, 0.5); }
  50% { box-shadow: 0 0 16px rgba(229, 57, 53, 0.9); }
}
```

### 모달 등장 애니메이션

```css
@keyframes modalEnter {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-content {
  animation: modalEnter 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);
}
```

---

## 📦 폴더 구조 (참고)

```
src/
├── styles/
│   ├── tokens.css        # CSS 변수 (디자인 토큰)
│   ├── modal.css         # 모달 베이스
│   ├── buttons.css       # 버튼 스타일
│   └── screens.css       # 화면별 스타일
├── components/
│   ├── StartScreen.jsx   # 시작 화면 (배경 + 모달)
│   ├── StageSelect.jsx   # 스테이지 선택
│   ├── HUD.jsx           # 인게임 HUD
│   ├── Clear.jsx         # 클리어 화면
│   ├── GameOver.jsx      # 게임오버
│   ├── Footer.jsx        # 푸터
│   └── ui/               # 공통 컴포넌트
│       ├── Modal.jsx
│       ├── Button.jsx
│       ├── Stars.jsx
│       └── GradeButton.jsx
```

---

## ✅ 작업 체크리스트

| # | 작업 | 우선순위 |
|---|------|---------|
| 1 | `tokens.css` 디자인 토큰 추가 | 🔴 필수 |
| 2 | 폰트 import (Cinzel, Pretendard, JetBrains Mono) | 🔴 필수 |
| 3 | StartScreen.jsx — 배경 이미지 + 메인 모달 | 🔴 필수 |
| 4 | StageSelect.jsx — 카드 그리드 다크 톤 | 🔴 필수 |
| 5 | HUD.jsx — 좌상/우상 패널 글래스 모피즘 | 🔴 필수 |
| 6 | Clear.jsx + GameOver.jsx — 결과 화면 | 🟡 권장 |
| 7 | 버튼 베이스 스타일 (btn-primary, btn-secondary) | 🔴 필수 |
| 8 | Footer.jsx — 작고 미니멀하게 | 🟢 선택 |
| 9 | 모달 등장 애니메이션 | 🟢 선택 |
| 10 | 호버/액티브 글로우 효과 | 🟡 권장 |

---

## 🎯 클로드 코드 첫 메시지 템플릿

```
랜딩 배경 이미지 추가했어:
- 경로: public/assets/images/landing-bg.png

Phase 8.1 진행: UI 다크 톤 통일 (Hades/NecroDancer 스타일)

GAME_DESIGN.md의 UI 명세는 별도 파일로 줬어: UI_MODAL_DESIGN.md
이 명세 따라서 모든 모달/HUD/버튼을 다크 톤으로 통일.

작업 순서:
1. src/styles/tokens.css 추가 — CSS 변수 (디자인 토큰)
2. 폰트 import (Cinzel, Pretendard, JetBrains Mono)
3. StartScreen.jsx — 배경 이미지 + 다크 모달
4. StageSelect.jsx — 카드 그리드 다크 톤
5. HUD.jsx — 글래스 모피즘 패널
6. Clear.jsx / GameOver.jsx — 결과 화면
7. 버튼 베이스 스타일

체크포인트: 1~3 끝나면 확인받고 다음, 4~7도 묶어서 확인.

기존 기능은 모두 유지. 디자인만 교체.
```

---

**📝 이 명세는 디자인 가이드입니다. 클로드 코드가 구현 디테일은 유연하게 결정 가능.**
