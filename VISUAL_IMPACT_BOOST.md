# 💥 무궁무진 워 — 시각 임팩트 강화 (Phase 8.5)

> v1.0 · 2026-05-25
> 레퍼런스: 라스트 워 광고 게임 (보스전 캡처)
> 목표: "개발 버전" → "진짜 게임" 느낌으로

---

## 🎯 작업 범위

| # | 작업 | 효과 | 작업량 |
|---|------|------|------|
| 1 | 사격 이펙트 부피감 | ⭐⭐⭐⭐⭐ | 🟢 작음 |
| 2 | 게이트 거대화 + 디테일 | ⭐⭐⭐⭐ | 🟢 작음 |
| 3 | 충돌 이펙트 강화 (분수 폭발) | ⭐⭐⭐⭐⭐ | 🟡 보통 |
| 5 | +1/+20 텍스트 풍부함 | ⭐⭐⭐ | 🟢 작음 |

**제외**: 4 (군단 밀집도) — V자 포메이션은 우리 정체성으로 유지

---

## 🔫 1. 사격 이펙트 부피감

### 1-1. 발사체 (Bullet) 시각 강화

`src/game/entities/Bullet.js` 수정:

```javascript
// 기존
const BULLET_SCALE = 0.45;  // 또는 비슷한 크기
const BULLET_COLOR = 0xFFD600;  // 노란색

// 변경
const BULLET_SCALE_X = 0.3;   // 가로는 슬림
const BULLET_SCALE_Y = 0.3;
const BULLET_SCALE_Z = 1.8;   // 세로는 길게 (스트레치)
const BULLET_COLOR = 0x00B4FF;  // 진한 파란색 (레퍼런스 톤)
const BULLET_EMISSIVE = 0x00B4FF;
const BULLET_EMISSIVE_INTENSITY = 1.2;  // 강한 발광
```

### 1-2. 발사체 트레일 (꼬리 잔상)

```javascript
// 매 발사체마다 트레일 메쉬 추가
function createBulletWithTrail() {
  const group = new THREE.Group();
  
  // 메인 발사체 (스트레치 큐브)
  const bullet = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 1.8),
    new THREE.MeshStandardMaterial({
      color: 0x00B4FF,
      emissive: 0x00B4FF,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 1.0,
    })
  );
  group.add(bullet);
  
  // 트레일 (뒤쪽 fade out)
  const trail = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 2.5),
    new THREE.MeshBasicMaterial({
      color: 0x66D9FF,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    })
  );
  trail.position.z = 1.5;  // 본체 뒤쪽
  group.add(trail);
  
  return group;
}
```

### 1-3. 발사 시 글로우 효과

각 발사체 발사 시점에:
```javascript
// 작은 파란 빛 폭발 (머즐 플래시 강화)
function flashMuzzleAt(position) {
  const flash = muzzlePool.acquire();
  flash.material.color.setHex(0x00B4FF);
  flash.scale.setScalar(0.6);  // 기존보다 크게
  flash.material.opacity = 1.0;
  flash.position.copy(position);
  flash.visible = true;
  
  // 0.1초간 빠르게 페이드아웃
  flash.userData.fadeFrames = 6;
  flash.userData.fadeStep = 0.16;
}
```

### 1-4. 색상 변경 영향 검토

⚠️ **현재 배경이 검정/파랑이면 파란 발사체가 안 보일 수 있음.**

해결책:
- 발사체 emissive intensity 1.2로 강하게
- 발사체에 외곽 light glow (PointLight)
- 또는 발사체 메인은 진한 파랑, 외곽은 흰색 테두리

#### 안전한 색상 (배경별 검증)

| 배경 | 발사체 색상 |
|------|----------|
| 학원가 (베이지 길) | `#00B4FF` (진파랑) ✅ 잘 보임 |
| 시험지 (회색) | `#00B4FF` ✅ |
| 사이버 (보라) | `#00FFFF` (시안) ⭐ 보라 위에 더 강함 |
| 옥상 (검정) | `#00FFFF` ⭐ |

→ **스테이지별 동적 색상** 또는 **공통 시안 `#00BCD4`** 추천

---

## 🚪 2. 게이트 거대화 + 디테일

### 2-1. 게이트 크기

`src/game/entities/Gate.js` 수정:

```javascript
// 기존
const GATE_WIDTH = 2.5;   // 가로
const GATE_HEIGHT = 1.5;  // 세로

// 변경 (세로 대폭 ↑)
const GATE_WIDTH = 2.5;   // 가로 그대로
const GATE_HEIGHT = 4.0;  // 세로 3배 가까이 (압도감)
const GATE_DEPTH = 0.15;  // 약간 두께 추가
```

### 2-2. 게이트 외형 - 입체감 추가

```javascript
function createGateMesh(answerNumber, hp) {
  const group = new THREE.Group();
  
  // 메인 패널 (큰 직사각형)
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(GATE_WIDTH, GATE_HEIGHT, GATE_DEPTH),
    new THREE.MeshStandardMaterial({
      color: 0x4A90E2,        // 파란색
      transparent: true,
      opacity: 0.7,
      emissive: 0x2196F3,
      emissiveIntensity: 0.3,
    })
  );
  group.add(panel);
  
  // 게이트 프레임 (테두리) - 위/아래
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1976D2,
    emissive: 0x1976D2,
    emissiveIntensity: 0.5,
  });
  
  // 상단 프레임
  const topFrame = new THREE.Mesh(
    new THREE.BoxGeometry(GATE_WIDTH + 0.3, 0.2, 0.3),
    frameMat
  );
  topFrame.position.y = GATE_HEIGHT / 2 + 0.1;
  group.add(topFrame);
  
  // 하단 프레임
  const bottomFrame = topFrame.clone();
  bottomFrame.position.y = -GATE_HEIGHT / 2 - 0.1;
  group.add(bottomFrame);
  
  // 좌우 프레임 (얇은 기둥)
  const leftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, GATE_HEIGHT + 0.4, 0.3),
    frameMat
  );
  leftFrame.position.x = -GATE_WIDTH / 2 - 0.1;
  group.add(leftFrame);
  
  const rightFrame = leftFrame.clone();
  rightFrame.position.x = GATE_WIDTH / 2 + 0.1;
  group.add(rightFrame);
  
  // 정답 숫자 (큰 텍스트, 가운데)
  const answerSprite = createAnswerSprite(answerNumber);
  answerSprite.position.z = GATE_DEPTH / 2 + 0.01;
  group.add(answerSprite);
  
  // HP 바 (게이트 상단 띠 형태로 통합)
  const hpBar = createHPBarSprite(hp, hp);
  hpBar.position.y = GATE_HEIGHT / 2 - 0.3;
  hpBar.position.z = GATE_DEPTH / 2 + 0.01;
  group.add(hpBar);
  
  return group;
}
```

### 2-3. 정답 숫자 시각화

```javascript
function createAnswerSprite(number) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // 배경 없음 (투명)
  
  // 그림자 (외곽선)
  ctx.font = 'bold 140px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#0D47A1';
  ctx.strokeText(number, 128, 128);
  
  // 흰 글씨
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(number, 128, 128);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true })
  );
  sprite.scale.set(1.5, 1.5, 1);
  return sprite;
}
```

### 2-4. 문제판 (게이트 위 별도 패널)

기존: 게이트 위 작은 흰 카드
**변경**: 더 크게, 더 명확하게

```javascript
function createProblemPanel(question) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // 배경 - 다크 글래스 (Hades 톤)
  ctx.fillStyle = 'rgba(15, 14, 26, 0.85)';
  ctx.fillRect(0, 0, 1024, 256);
  
  // 골드 테두리
  ctx.strokeStyle = '#FFC107';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 1016, 248);
  
  // 문제 텍스트 (큰 골드)
  ctx.font = 'bold 120px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFD600';
  ctx.fillText(question, 512, 128);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true })
  );
  sprite.scale.set(4, 1, 1);  // 가로로 길게
  sprite.position.y = GATE_HEIGHT / 2 + 1.2;  // 게이트 위쪽
  
  return sprite;
}
```

### 2-5. HP 바 스타일 유지

기존 v2.2.1에서 잘 작동하니까 그대로 유지하되:
- HP 바 위치를 게이트 상단 띠 형태로 (게이트 위가 아닌 게이트에 통합)
- HP 0이 되면 게이트 자체가 산산조각 (파편 비)

---

## 💥 3. 충돌 이펙트 강화

### 3-1. 적 처치 시 (Burst 강화)

`src/game/entities/Burst.js` 또는 처치 처리 코드:

```javascript
function spawnEnemyDeathEffect(position, enemyType) {
  // 1. 메인 폭발 (큰 파편)
  for (let i = 0; i < 12; i++) {  // 기존 8 → 12
    const particle = burstPool.acquire();
    particle.scale.setScalar(0.5 + Math.random() * 0.3);  // 기존 0.3 → 0.5~0.8
    particle.material.color.setHex(getEnemyColor(enemyType));
    particle.position.copy(position);
    
    // 더 멀리 튕기게
    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,   // 좌우
      Math.random() * 0.4 + 0.2,     // 위로
      (Math.random() - 0.5) * 0.5
    );
    particle.userData.gravity = 0.015;
    particle.userData.life = 30;     // 0.5초
  }
  
  // 2. 흰 섬광 (중심 밝게)
  const flash = flashPool.acquire();
  flash.position.copy(position);
  flash.scale.setScalar(1.5);
  flash.material.color.setHex(0xFFFFFF);
  flash.material.opacity = 1.0;
  flash.userData.fadeFrames = 8;
  
  // 3. 충격파 링 (옵션 - Lv4+)
  if (enemyHP > 5) {
    spawnShockwaveRing(position, {
      color: 0xFFD600,
      expandTo: 1.5,
      duration: 0.4,
    });
  }
}
```

### 3-2. 게이트 부서질 때 (특별 이펙트)

```javascript
function onGateDestroyed(gate, isCorrect) {
  const color = isCorrect ? 0x00FFFF : 0xE53935;  // 정답: 시안, 오답: 빨강
  
  // 1. 거대한 폭발 (30개 파편)
  for (let i = 0; i < 30; i++) {
    const particle = burstPool.acquire();
    particle.scale.setScalar(0.4 + Math.random() * 0.5);
    particle.material.color.setHex(color);
    particle.position.copy(gate.position);
    
    // 360도 방향으로 튕김
    const angle = (i / 30) * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.4;
    particle.userData.velocity = new THREE.Vector3(
      Math.cos(angle) * speed,
      Math.random() * 0.5,
      Math.sin(angle) * speed
    );
    particle.userData.gravity = 0.012;
    particle.userData.life = 50;
  }
  
  // 2. 충격파 링 (수평)
  spawnShockwaveRing(gate.position, {
    color: color,
    expandTo: 4,
    duration: 0.6,
  });
  
  // 3. 화면 흔들림 (보스 처치 수준)
  this.shake += 20;  // 기존 14 → 20프레임
  
  // 4. 빛 폭발 (PointLight 임시)
  spawnTemporaryLight(gate.position, {
    color: color,
    intensity: 5,
    duration: 0.3,
  });
}
```

### 3-3. 발사체 게이트 명중 (지속 효과)

게이트에 발사체가 맞을 때:
```javascript
function onBulletHitGate(bullet, gate) {
  // 명중 파편 (작은 폭발)
  for (let i = 0; i < 5; i++) {  // 기존 1~2 → 5
    const particle = burstPool.acquire();
    particle.scale.setScalar(0.2);
    particle.material.color.setHex(0x00B4FF);  // 발사체와 같은 색
    particle.position.copy(bullet.position);
    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      Math.random() * 0.3,
      (Math.random() - 0.5) * 0.2
    );
    particle.userData.life = 15;
  }
  
  gate.applyDamage(bullet.damage);
}
```

---

## 📝 5. +1/+20 텍스트 풍부함

### 5-1. 게이트 정답 통과 시 - 다발 텍스트

기존: "+20" 한 번 떠오름
**변경**: "+1" 텍스트가 20개 순차적으로 떠오름 (시각적 풍부함)

```javascript
function spawnGateRewardTexts(gatePosition, totalReward) {
  // totalReward = 20이면 +1 텍스트 20개
  // totalReward = 30이면 +1 텍스트 30개 (단, 최대 30개 캡)
  
  const count = Math.min(totalReward, 30);
  
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const text = floatTextPool.acquire();
      text.material.map = textTexture('+1', '#4CAF50');
      
      // 게이트 부근 랜덤 위치
      text.position.set(
        gatePosition.x + (Math.random() - 0.5) * 1.5,
        gatePosition.y + Math.random() * 0.5,
        gatePosition.z
      );
      text.scale.setScalar(0.4);
      
      // 위로 떠오름
      text.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        0.08,
        0
      );
      text.userData.life = 40;
      text.userData.fadeStart = 25;
      
    }, i * 50);  // 50ms 간격으로 순차
  }
  
  // 최종 +20 큰 텍스트 (마지막에)
  setTimeout(() => {
    spawnBigFloatingText(gatePosition, `+${totalReward}`, '#FFD600');
  }, count * 50);
}
```

### 5-2. 적 처치 텍스트 크기

기존: 14pt 정도
**변경**: 24pt + 글로우

```javascript
function createScoreText(value, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  // 글로우 효과
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  
  // 외곽선
  ctx.font = 'bold 36px "Pretendard"';  // 기존 24 → 36
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(`+${value}`, 64, 32);
  
  // 본문
  ctx.fillStyle = color;
  ctx.fillText(`+${value}`, 64, 32);
  
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true })
  );
  sprite.scale.set(0.6, 0.3, 1);
  return sprite;
}
```

### 5-3. 큰 보상 시 화면 가운데 메가 텍스트

게이트 정답 통과 등 큰 이벤트:
```jsx
// React 컴포넌트 (HUD 위에 오버레이)
<div className="mega-feedback" style={{
  fontFamily: 'Cinzel, serif',
  fontSize: 64,
  fontWeight: 900,
  color: '#FFD600',
  textShadow: '0 0 30px rgba(255, 214, 0, 0.8)',
  animation: 'megaPulse 1s ease-out',
}}>
  +20 💪
</div>

// CSS
@keyframes megaPulse {
  0%   { opacity: 0; transform: scale(0.5); }
  20%  { opacity: 1; transform: scale(1.3); }
  60%  { opacity: 1; transform: scale(1.0); }
  100% { opacity: 0; transform: scale(1.2); }
}
```

---

## 🎨 색상 팔레트 정리

| 요소 | 색상 | HEX |
|------|------|-----|
| 발사체 메인 | 진파랑 | `#00B4FF` |
| 발사체 트레일 | 라이트 시안 | `#66D9FF` |
| 게이트 메인 | 미디엄 블루 | `#4A90E2` |
| 게이트 프레임 | 다크 블루 | `#1976D2` |
| 게이트 정답 깨짐 | 시안 | `#00FFFF` |
| 게이트 오답 충돌 | 빨강 | `#E53935` |
| +1 텍스트 (정답) | 초록 | `#4CAF50` |
| +20 텍스트 (보상) | 골드 | `#FFD600` |
| 적 처치 점수 | 골드 | `#FFD600` |

---

## ⚖️ 성능 가이드라인

- **버스트 풀 사이즈**: 50 → **100** 확장 (다발 파편)
- **플로트 텍스트 풀**: 30 → **50**
- **충격파 링**: 동시 최대 5개
- **PointLight**: 동시 최대 3개 (성능 주의)
- **트레일 메쉬**: 발사체와 같이 풀링 (별도 풀 X)

---

## ✅ 작업 체크리스트

| # | 작업 | 파일 | 시간 |
|---|------|------|----|
| 1 | 발사체 스트레치 (1.8z) + 파란색 #00B4FF + emissive 1.2 | Bullet.js | 15분 |
| 2 | 발사체 트레일 메쉬 추가 | Bullet.js | 20분 |
| 3 | 머즐 플래시 크기 0.6 + 파란색 | weapons.js | 10분 |
| 4 | 게이트 높이 1.5 → 4.0 + 프레임 추가 | Gate.js | 30분 |
| 5 | 게이트 정답 숫자 sprite 크게 + 흰 글씨 | Gate.js | 20분 |
| 6 | 문제판 다크 글래스 + 골드 테두리 | Gate.js | 20분 |
| 7 | 적 처치 파편 12개 + 흰 섬광 추가 | Burst.js / Engine.js | 25분 |
| 8 | 게이트 부서질 때 30개 파편 + 충격파 링 | Engine.js | 30분 |
| 9 | 발사체 게이트 명중 파편 5개 | Engine.js | 15분 |
| 10 | +1 텍스트 다발 (게이트 통과 시 20개) | floatText.js | 25분 |
| 11 | 적 처치 텍스트 크기 36pt + 글로우 | floatText.js | 15분 |
| 12 | 화면 가운데 메가 +20 텍스트 (React) | HUD.jsx | 20분 |
| 13 | 풀 사이즈 확장 (Burst 100, Float 50) | pools.js | 5분 |

**총 약 4시간 작업**

---

## 🎯 권장 진행 순서

```
[Phase 1] 발사체 강화 — 즉시 체감
1, 2, 3 (45분)
→ 새로고침해서 확인. "파란 빔이 화면 가득" 느낌

[Phase 2] 게이트 거대화 — 압도감
4, 5, 6 (70분)
→ 게이트가 우뚝 솟은 느낌

[Phase 3] 충돌 이펙트 — 손맛 폭발
7, 8, 9 (70분)
→ 처치할 때마다 "와" 소리 나옴

[Phase 4] 텍스트 풍부함 — 보상감
10, 11, 12, 13 (65분)
→ +1 텍스트가 가득 떠오름
```

---

## 🧪 테스트 시나리오

| 시나리오 | 기대 결과 |
|---------|---------|
| 친구 30명 발사 | 화면에 진파랑 빔이 깊이감 있게 날아감 |
| 게이트 등장 | 우뚝 솟은 거대한 벽 (압도감) |
| 게이트 깨질 때 | 30개 파편 + 시안 충격파 + 화면 흔들림 |
| 게이트 통과 (+20) | +1 텍스트 20개가 순차적으로 떠오름 |
| 적 처치 | 12개 파편 + 흰 섬광 + 큰 +10 골드 텍스트 |
| 보스전 사격 | 파란 빔 폭발 + 화면 가득 이펙트 |

---

## 📋 클로드 코드 메시지

```
플레이 테스트 후 "개발 버전 같다" 피드백 + 레퍼런스 이미지 분석 완료.

Phase 8.5 진행: 시각 임팩트 강화 (4영역 한 번에)

[명세 파일] VISUAL_IMPACT_BOOST.md

[1. 사격 이펙트]
- 발사체: 0.3 × 0.3 × 1.8 (스트레치) + 파란색 #00B4FF + emissive 1.2
- 발사체 트레일 메쉬 추가 (뒤쪽 fade, AdditiveBlending)
- 머즐 플래시 크기 0.6 + 파란색 변경

[2. 게이트 거대화]
- 게이트 높이 1.5 → 4.0 (세로 길게)
- 게이트 프레임 (상하좌우 테두리 메쉬 추가)
- 정답 숫자 sprite 크게 + 흰 글씨 + 다크 외곽선
- 문제판 다크 글래스 + 골드 테두리 (Hades 톤)
- HP 바는 기존 유지하되 게이트 상단 띠 형태로 통합

[3. 충돌 이펙트]
- 적 처치: 파편 12개 + 흰 섬광 추가
- 게이트 부서질 때: 30개 파편 (360도) + 시안 충격파 링 + 흔들림 20프레임
- 발사체 게이트 명중: 파편 5개 (작은 폭발)

[5. +1 텍스트 풍부함]
- 게이트 정답 통과 시: +1 텍스트 20개 순차 (50ms 간격)
- 적 처치 텍스트: 36pt + 글로우
- 큰 보상 시: 화면 가운데 메가 +20 텍스트 (Cinzel, 64pt, 골드, 1초 펄스)

[성능]
- Burst 풀 50 → 100
- Float 텍스트 풀 30 → 50

권장 순서:
1. 발사체 강화 (45분) — 확인
2. 게이트 거대화 (70분) — 확인
3. 충돌 이펙트 (70분) — 확인
4. 텍스트 풍부함 (65분)

V자 포메이션은 우리 정체성이라 유지. 군단 밀집도는 변경 X.
```
