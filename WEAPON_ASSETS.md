# ⚔️ 무궁무진 워 — 무기 에셋 디자인 명세

> Phase 8.2: 학용품 무기 시각화 (Three.js 직접 모델링)
> v1.0 · 2026-05-25

---

## 🎯 디자인 철학

> **"노란 큐브 5종"이 아니라 각자 고유한 학용품 외형 + 행동**

| 기존 (단조) | **목표 (Megabonk + 라스트 워 톤)** |
|----------|-------------------------|
| 모든 무기가 같은 노란 큐브 | **5종 각자 고유 모양** |
| 레벨업해도 시각 동일 | **레벨업 시 즉시 시각 변화** |
| 직선 발사만 | **각 무기마다 다른 움직임** (회전/직선/광역/포물선) |

---

## 🔧 무기 5종 명세

### Lv1. 📓 노트 던지기 (Notebook Throw)

```javascript
// src/game/entities/weapons/Notebook.js
function createNotebookMesh() {
  const group = new THREE.Group();
  
  // 노트 본체 (얇은 판)
  const noteGeo = new THREE.BoxGeometry(0.4, 0.05, 0.55);
  const noteMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFF59D,           // 연노란색
    roughness: 0.6,
    emissive: 0xFFD600,
    emissiveIntensity: 0.3,
  });
  const note = new THREE.Mesh(noteGeo, noteMat);
  group.add(note);
  
  // 스프링 (위쪽 짧은 라인들)
  const springMat = new THREE.MeshStandardMaterial({ color: 0x424242 });
  for (let i = 0; i < 5; i++) {
    const spring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.08, 4),
      springMat
    );
    spring.position.set(-0.18 + i * 0.09, 0.04, -0.25);
    spring.rotation.x = Math.PI / 2;
    group.add(spring);
  }
  
  return group;
}
```

| 속성 | 값 |
|------|-----|
| **외형** | 얇은 직사각 판 + 위쪽에 작은 스프링 5개 |
| **색상** | 연노란색 `#FFF59D` + 발광 |
| **회전** | 날아가면서 Y축 빠르게 회전 (`mesh.rotation.y += 0.4`) |
| **데미지** | 1 |
| **사거리** | 짧음 (15유닛) |
| **발사 속도** | 18 프레임 쿨다운 |

### 발사 애니메이션
```javascript
// 매 프레임
bullet.mesh.rotation.y += 0.4;  // 빠른 회전
bullet.mesh.position.z -= speed; // 직선 전진
// 약간의 흔들림 (펄럭이는 느낌)
bullet.mesh.position.y += Math.sin(elapsedTime * 30) * 0.005;
```

---

### Lv2. 📐 자 휘두르기 (Ruler Swing)

```javascript
function createRulerMesh() {
  const group = new THREE.Group();
  
  // 길쭉한 자
  const rulerGeo = new THREE.BoxGeometry(0.15, 0.04, 1.2);
  const rulerMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFA000,           // 주황 (목재 느낌)
    roughness: 0.5,
    emissive: 0xFFC107,
    emissiveIntensity: 0.4,
  });
  const ruler = new THREE.Mesh(rulerGeo, rulerMat);
  group.add(ruler);
  
  // 자 위에 검은 눈금 (단순 표시)
  const markerMat = new THREE.MeshBasicMaterial({ color: 0x212121 });
  for (let i = 0; i < 10; i++) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.005, 0.02),
      markerMat
    );
    marker.position.set(0, 0.022, -0.5 + i * 0.11);
    group.add(marker);
  }
  
  return group;
}
```

| 속성 | 값 |
|------|-----|
| **외형** | 길쭉한 막대 + 검은 눈금 |
| **색상** | 주황색 `#FFA000` (나무 자 느낌) |
| **회전** | 횡방향 회전 (`mesh.rotation.z += 0.6`) |
| **데미지** | 2 |
| **사거리** | 중간 (20유닛) |
| **발사 속도** | 16 프레임 |
| **특이점** | **2~3마리 관통** (길어서) |

### 발사 애니메이션
```javascript
bullet.mesh.rotation.z += 0.6;  // 횡방향 회전 (자가 도는 느낌)
bullet.mesh.position.z -= speed;
// 충돌 시 관통 처리 — 첫 적에서 안 사라지고 계속 진행
```

---

### Lv3. ✏️ 연필 화살 (Pencil Arrow)

```javascript
function createPencilMesh() {
  const group = new THREE.Group();
  
  // 연필 몸통 (육각 기둥)
  const bodyGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6);
  const bodyMat = new THREE.MeshStandardMaterial({ 
    color: 0xFBC02D,           // 노란색
    roughness: 0.4,
    emissive: 0xFFD600,
    emissiveIntensity: 0.5,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = Math.PI / 2; // 가로로
  group.add(body);
  
  // 뾰족한 끝 (검정 심)
  const tipGeo = new THREE.ConeGeometry(0.06, 0.15, 6);
  const tipMat = new THREE.MeshStandardMaterial({ color: 0x212121 });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.z = -0.42;
  tip.rotation.x = -Math.PI / 2;
  group.add(tip);
  
  // 지우개 뒷부분 (분홍)
  const eraserGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 6);
  const eraserMat = new THREE.MeshStandardMaterial({ color: 0xF48FB1 });
  const eraser = new THREE.Mesh(eraserGeo, eraserMat);
  eraser.position.z = 0.41;
  eraser.rotation.x = Math.PI / 2;
  group.add(eraser);
  
  // 금속 밴드 (지우개와 몸통 사이)
  const bandGeo = new THREE.CylinderGeometry(0.071, 0.071, 0.04, 6);
  const bandMat = new THREE.MeshStandardMaterial({ 
    color: 0xBDBDBD,
    metalness: 0.7,
    roughness: 0.3,
  });
  const band = new THREE.Mesh(bandGeo, bandMat);
  band.position.z = 0.34;
  band.rotation.x = Math.PI / 2;
  group.add(band);
  
  return group;
}
```

| 속성 | 값 |
|------|-----|
| **외형** | 육각 기둥 + 뾰족한 끝 + 분홍 지우개 |
| **색상** | 노란색 몸통 + 검정 심 + 분홍 지우개 + 은색 밴드 |
| **회전** | 없음 (뾰족한 끝이 앞으로) |
| **데미지** | 3 |
| **사거리** | 김 (25유닛) |
| **발사 속도** | 14 프레임 |
| **특이점** | **트레일** (꼬리 잔상) |

### 발사 애니메이션 + 트레일
```javascript
// 연필은 회전 X, 직선 발사 (화살처럼)
bullet.mesh.position.z -= speed * 1.3; // 더 빠름

// 트레일 효과 — 5프레임 이전 위치 잔상
trailPool.spawnAt(previousPositions[5], {
  scale: 0.5,
  color: 0xFFD600,
  fadeOut: 8,
});
```

---

### Lv4. 🧹 칠판지우개 폭격 (Eraser Bomb)

```javascript
function createEraserMesh() {
  const group = new THREE.Group();
  
  // 펠트 부분 (위쪽 - 흰색)
  const feltGeo = new THREE.BoxGeometry(0.5, 0.18, 0.3);
  const feltMat = new THREE.MeshStandardMaterial({ 
    color: 0xECEFF1,           // 거의 흰색 (분필 묻은 느낌)
    roughness: 0.95,
  });
  const felt = new THREE.Mesh(feltGeo, feltMat);
  felt.position.y = 0.09;
  group.add(felt);
  
  // 나무 몸체 (아래쪽)
  const woodGeo = new THREE.BoxGeometry(0.5, 0.1, 0.3);
  const woodMat = new THREE.MeshStandardMaterial({ 
    color: 0x5D4037,           // 진갈색 (나무)
    roughness: 0.7,
  });
  const wood = new THREE.Mesh(woodGeo, woodMat);
  wood.position.y = -0.05;
  group.add(wood);
  
  // 분필 가루 효과 (작은 흰 큐브들)
  for (let i = 0; i < 3; i++) {
    const dust = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.05),
      new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF, 
        transparent: true, 
        opacity: 0.6,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.3,
      })
    );
    dust.position.set(
      (Math.random() - 0.5) * 0.6,
      0.2 + Math.random() * 0.2,
      (Math.random() - 0.5) * 0.4
    );
    dust.userData.isDust = true;
    group.add(dust);
  }
  
  return group;
}
```

| 속성 | 값 |
|------|-----|
| **외형** | 흰 펠트 + 갈색 나무 + 분필 가루 |
| **색상** | 흰색 + 진갈색 |
| **회전** | 천천히 X축 회전 (`mesh.rotation.x += 0.15`) |
| **데미지** | 5 (광역) |
| **사거리** | 짧음 (15유닛) - 포물선 |
| **발사 속도** | 22 프레임 (느리지만 강함) |
| **특이점** | **포물선 + 착탄 시 광역 폭발 (반경 2유닛)** |

### 발사 애니메이션 - 포물선 (수류탄 느낌)
```javascript
// 초기 발사 시 위쪽 속도 부여
bullet.velocity = new THREE.Vector3(0, 0.15, -0.3);

// 매 프레임 중력 적용
bullet.velocity.y -= 0.012; // 중력
bullet.mesh.position.add(bullet.velocity);
bullet.mesh.rotation.x += 0.15;

// 분필 가루 흔들림
bullet.mesh.children.forEach(c => {
  if (c.userData.isDust) {
    c.position.y += Math.sin(elapsedTime * 10) * 0.005;
  }
});

// 착탄 시 (y < 0.3 또는 적 충돌)
function onImpact(position) {
  // 광역 폭발 — 반경 2유닛 내 모든 적
  spawnExplosionParticles(position, {
    count: 20,
    color: 0xFFFFFF,
    scale: 2.0,
  });
  
  // 반경 데미지
  enemies.forEach(enemy => {
    if (enemy.position.distanceTo(position) < 2) {
      enemy.takeDamage(damage);
    }
  });
  
  // 분필 가루 잔류 (1초간)
  spawnChalkDust(position, 1.0);
}
```

---

### Lv5. 📕 사전 슬램 (Dictionary Slam) ⭐ 최종 무기

```javascript
function createDictionaryMesh() {
  const group = new THREE.Group();
  
  // 두꺼운 책 본체 (붉은 표지)
  const bookGeo = new THREE.BoxGeometry(0.5, 0.25, 0.7);
  const bookMat = new THREE.MeshStandardMaterial({ 
    color: 0xB71C1C,           // 진한 빨강 (사전 표지)
    roughness: 0.4,
    metalness: 0.2,
    emissive: 0xE53935,
    emissiveIntensity: 0.3,
  });
  const book = new THREE.Mesh(bookGeo, bookMat);
  group.add(book);
  
  // 책 옆면 (페이지 - 흰색)
  const pageGeo = new THREE.BoxGeometry(0.48, 0.22, 0.68);
  const pageMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFF8E1,
    roughness: 0.9,
  });
  const pages = new THREE.Mesh(pageGeo, pageMat);
  pages.position.x = 0.012;
  group.add(pages);
  
  // 금색 책등 장식 (위아래)
  const stripMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFC107,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xFFD600,
    emissiveIntensity: 0.6,
  });
  const stripTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.51, 0.04, 0.71),
    stripMat
  );
  stripTop.position.y = 0.105;
  group.add(stripTop);
  
  const stripBottom = new THREE.Mesh(
    new THREE.BoxGeometry(0.51, 0.04, 0.71),
    stripMat
  );
  stripBottom.position.y = -0.105;
  group.add(stripBottom);
  
  // 책 주변 빛나는 오라
  const auraGeo = new THREE.SphereGeometry(0.6, 12, 12);
  const auraMat = new THREE.MeshBasicMaterial({ 
    color: 0xFFD600, 
    transparent: true, 
    opacity: 0.2,
  });
  const aura = new THREE.Mesh(auraGeo, auraMat);
  aura.userData.isAura = true;
  group.add(aura);
  
  return group;
}
```

| 속성 | 값 |
|------|-----|
| **외형** | 두꺼운 책 + 금장 + 빛나는 오라 |
| **색상** | 진빨강 표지 + 흰색 페이지 + 금색 장식 |
| **회전** | 천천히 Z축 회전 (`mesh.rotation.z += 0.2`) |
| **데미지** | 10 (최강 + 광역) |
| **사거리** | 매우 김 (30유닛) |
| **발사 속도** | 28 프레임 (가장 느림) |
| **특이점** | **충격파 + 관통 + 광역** |

### 발사 애니메이션 + 충격파
```javascript
// 사전은 천천히 회전하며 직선 발사
bullet.mesh.rotation.z += 0.2;
bullet.mesh.position.z -= speed;

// 오라 펄스
bullet.mesh.children.forEach(c => {
  if (c.userData.isAura) {
    const pulse = 1 + Math.sin(elapsedTime * 6) * 0.15;
    c.scale.setScalar(pulse);
  }
});

// 적 충돌 시 — 관통 + 충격파
function onHit(enemy) {
  enemy.takeDamage(damage);
  
  // 충격파 — 적 위치 반경 3유닛 모든 적에게 50% 데미지
  enemies.forEach(other => {
    if (other !== enemy && other.position.distanceTo(enemy.position) < 3) {
      other.takeDamage(damage * 0.5);
    }
  });
  
  // 시각 — 충격파 링
  spawnShockwave(enemy.position, {
    color: 0xFFD600,
    expandTo: 3,
    duration: 0.5,
  });
  
  // 관통 — 최대 3마리까지
  bullet.pierceCount++;
  if (bullet.pierceCount >= 3) bullet.destroy();
}
```

---

## 🎨 무기별 비주얼 임팩트 비교

| Lv | 무기 | 핵심 동작 | 시각 임팩트 |
|----|------|---------|----------|
| 1 | 📓 노트 | Y축 회전 + 직선 | ⭐⭐ 기본 |
| 2 | 📐 자 | Z축 회전 + 관통 | ⭐⭐⭐ 길쭉함 |
| 3 | ✏️ 연필 | 직선 + 트레일 | ⭐⭐⭐⭐ 화살 느낌 |
| 4 | 🧹 지우개 | 포물선 + 광역 폭발 | ⭐⭐⭐⭐⭐ 폭격 |
| 5 | 📕 사전 | 직선 + 충격파 + 관통 | ⭐⭐⭐⭐⭐⭐ 최강 |

---

## 🛠️ 폴더 구조

```
src/game/entities/weapons/
├── index.js               # 무기 팩토리 (Lv1~5 매핑)
├── Notebook.js            # Lv1
├── Ruler.js               # Lv2
├── Pencil.js              # Lv3
├── Eraser.js              # Lv4
└── Dictionary.js          # Lv5
```

### index.js 예시

```javascript
import { createNotebookMesh } from './Notebook.js';
import { createRulerMesh } from './Ruler.js';
import { createPencilMesh } from './Pencil.js';
import { createEraserMesh } from './Eraser.js';
import { createDictionaryMesh } from './Dictionary.js';

export const WEAPON_FACTORY = {
  1: { create: createNotebookMesh, behavior: 'spin-y' },
  2: { create: createRulerMesh, behavior: 'spin-z-pierce' },
  3: { create: createPencilMesh, behavior: 'straight-trail' },
  4: { create: createEraserMesh, behavior: 'parabola-aoe' },
  5: { create: createDictionaryMesh, behavior: 'pierce-shockwave' },
};
```

---

## ⚙️ Bullet.js 리팩토링

기존 `Bullet.js`가 단순 큐브였다면, 이제 무기 타입별 분기:

```javascript
// src/game/entities/Bullet.js
import { WEAPON_FACTORY } from './weapons/index.js';

class Bullet {
  constructor(weaponLevel) {
    const factory = WEAPON_FACTORY[weaponLevel];
    this.mesh = factory.create();
    this.behavior = factory.behavior;
    this.weaponLevel = weaponLevel;
  }
  
  update(delta) {
    switch (this.behavior) {
      case 'spin-y':
        this.mesh.rotation.y += 0.4;
        this.mesh.position.z -= this.speed;
        break;
      case 'spin-z-pierce':
        this.mesh.rotation.z += 0.6;
        this.mesh.position.z -= this.speed;
        break;
      case 'straight-trail':
        this.mesh.position.z -= this.speed * 1.3;
        this._emitTrail();
        break;
      case 'parabola-aoe':
        this.velocity.y -= 0.012;
        this.mesh.position.add(this.velocity);
        this.mesh.rotation.x += 0.15;
        if (this.mesh.position.y < 0.3) this._explode();
        break;
      case 'pierce-shockwave':
        this.mesh.rotation.z += 0.2;
        this.mesh.position.z -= this.speed;
        this._pulseAura();
        break;
    }
  }
}
```

---

## ✅ 작업 체크리스트

| # | 작업 | 난이도 | 예상 시간 |
|---|------|------|---------|
| 1 | `weapons/` 폴더 생성 + 5개 파일 분리 | 🟢 쉬움 | 10분 |
| 2 | `Notebook.js` — 노트 메쉬 + Y회전 | 🟡 보통 | 30분 |
| 3 | `Ruler.js` — 자 메쉬 + Z회전 + 관통 처리 | 🟡 보통 | 40분 |
| 4 | `Pencil.js` — 연필 메쉬 + 트레일 시스템 | 🟡 보통 | 50분 |
| 5 | `Eraser.js` — 지우개 메쉬 + 포물선 + 광역 폭발 | 🔴 어려움 | 1시간 |
| 6 | `Dictionary.js` — 사전 메쉬 + 충격파 + 관통 | 🔴 어려움 | 1시간 |
| 7 | `Bullet.js` 리팩토링 — behavior 분기 | 🟡 보통 | 40분 |
| 8 | 무기 레벨업 시각 피드백 (모달 / 큰 텍스트) | 🟢 쉬움 | 20분 |

**총 약 5~6시간 작업**

### 권장 순서

```
1. weapons 폴더 분리 (#1)
2. Lv1 노트 (#2) — 가장 단순, 작동 검증
3. Bullet.js 리팩토링 (#7) — 분기 구조 잡기
4. Lv3 연필 (#4) — 트레일 시스템 (가장 임팩트 큼)
5. Lv2 자 (#3) — 관통 처리
6. Lv5 사전 (#6) — 충격파 (보스용 무기)
7. Lv4 지우개 (#5) — 가장 복잡 (포물선)
8. 무기 레벨업 모달 (#8)
```

---

## 🎯 테스트 시나리오

| 시나리오 | 기대 결과 |
|---------|---------|
| Lv1으로 시작 | 노란 노트가 회전하며 날아감 |
| Lv2 무기↑ 통과 | 노트가 자로 변경, 횡회전, 적 관통 |
| Lv3 무기↑ | 연필 화살, 노란 트레일 꼬리 |
| Lv4 무기↑ | 지우개가 포물선으로 날아가 분필 가루 폭발 |
| Lv5 무기↑ | 빛나는 사전, 충격파 + 관통 |
| 보스전 (Lv5) | 화면 가득 노란 충격파 |

---

## 💡 한 가지 더: 무기 업그레이드 모달

레벨업 시 화면 가운데 큼지막하게 표시:

```jsx
<div className="weapon-upgrade-modal">
  <p className="upgrade-label">WEAPON UPGRADED</p>
  <h2 className="weapon-name">📐 자 휘두르기</h2>
  <p className="weapon-stat">관통 사거리 +30%</p>
</div>
```

- 화면 중앙 페이드인 (0.5초)
- 1.5초 유지
- 페이드아웃 (0.5초)
- 동시에 무기 메쉬 미리보기 회전

---

## 🎨 통일 디자인 가이드

| 항목 | 가이드 |
|------|-------|
| **공통 발광** | 모든 무기 `emissive` 사용 → 어두운 배경에서도 보임 |
| **회전 방향** | 무기마다 다른 축 (Y/Z/X) → 시각적 다양성 |
| **크기** | Lv1~5 점점 커짐 (0.4 → 0.7) → 성장감 |
| **색상 톤** | 노란 계열 유지 (게임 정체성) + Lv5만 빨강 (특별함) |

---

**📝 다음 단계**: 클로드 코드에 이 명세 전달 + Lv1 (노트) 부터 작업 시작.

```
무기 에셋 명세서 WEAPON_ASSETS.md 추가했어.
Phase 8.2 진행: 학용품 5종 무기 시각화.

작업 순서 (체크리스트 참조):
1. src/game/entities/weapons/ 폴더 + 5개 파일 분리
2. Lv1 노트 (Y축 회전)
3. Bullet.js 리팩토링 (behavior 분기)
4. Lv3 연필 (트레일)
5. Lv2 자 (관통)
6. Lv5 사전 (충격파)
7. Lv4 지우개 (포물선 + 광역)
8. 무기 레벨업 모달

Lv1까지 끝나면 확인받고 다음.
기존 게임 로직 그대로 유지. 시각/메쉬만 교체.
```
