# 무궁무진 워 (MuMu War) — CLAUDE.md

> 무궁무진클래스 시리즈 · L1 React + Vite + Three.js + localStorage
> 라스트 워(Last War) 스타일 3D 군중 슈팅 러너 게임

---

## 🎯 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **장르** | 3D 군중 슈팅 러너 (Crowd Runner Shooter) |
| **레퍼런스** | Last War: Survival, Count Masters |
| **플랫폼** | 웹 (태블릿 가로모드 최적화, PC도 OK) |
| **주인공** | 초등학생 (플레이어 본인) |
| **목표** | 친구들 모으고 → 빌런 처치 → 학교를 지킨다 |

## 🛠 기술 스택

- **빌드**: Vite
- **프레임워크**: React (UI/HUD 전용)
- **3D 엔진**: Three.js (직접 제어, R3F 미사용 — 게임 루프 단순화)
- **스타일**: Tailwind CSS (UI 오버레이만)
- **저장**: localStorage (최고점수, 잠금해제, 설정)
- **배포**: Vercel
- **저장소**: GitHub

## 📁 폴더 구조

```
src/
├── main.jsx                # Vite 엔트리
├── App.jsx                 # React 루트 (메뉴/HUD/게임캔버스 스위칭)
├── game/
│   ├── Engine.js           # Three.js 씬·카메라·렌더러·게임루프
│   ├── input.js            # 터치/마우스 드래그 입력
│   ├── entities/
│   │   ├── Player.js       # 주인공 학생
│   │   ├── Crowd.js        # 따라오는 친구 군단 (인스턴스 메쉬)
│   │   ├── Gate.js         # +10 / x2 / x3 게이트
│   │   ├── Enemy.js        # 적 (숙제더미·잔소리풍선·트롤·좀비)
│   │   ├── Boss.js         # 보스 (학교폭력 우두머리)
│   │   └── Bullet.js       # 발사체 (책 던지기)
│   ├── scenes/
│   │   ├── Stage1.js       # 1스테이지 (숙제더미)
│   │   ├── Stage2.js       # 2스테이지 (잔소리)
│   │   └── ...
│   └── utils/
│       ├── pool.js         # 오브젝트 풀링 (성능)
│       └── formation.js    # 군단 포메이션 계산
├── components/
│   ├── StartScreen.jsx     # 시작 화면
│   ├── HUD.jsx             # 인게임 HUD (인원수·점수·체력)
│   ├── GameOver.jsx        # 게임오버 화면
│   └── Footer.jsx          # 푸터 (필수 규격)
├── hooks/
│   └── useLocalStorage.js  # 최고점수·잠금해제 저장
└── styles/
    └── index.css           # Tailwind + 글로벌
```

## 🎨 디자인 토큰

### 색상 (밝고 친근한 학교 톤)
- **배경 (하늘)**: `#87CEEB`
- **길 (운동장)**: `#E8D9B5`
- **잔디**: `#7CB342`
- **주인공 티셔츠**: `#4A90E2`
- **친구 군단**: `#F4A300` (오렌지), `#E91E63` (핑크), `#9C27B0` (퍼플) — 다양화
- **게이트 +**: `#4CAF50` (초록)
- **게이트 ×**: `#2196F3` (파랑)
- **게이트 -**: `#F44336` (빨강)
- **빌런**: `#3E2723` (다크브라운)
- **포인트 컬러 (UI)**: `#FF6B6B` → `#FFA500` 그라데이션 (무궁무진 로고 톤)

### 폰트
- Pretendard (UI 전반)
- 게임 내 숫자/타이틀은 굵게

### UI 무드
- 둥근 모서리 (border-radius 12~20px)
- 강한 그림자 (box-shadow로 게임스러움)
- 백드롭 블러 (HUD 가독성)

## 🎮 게임 메커닉 (Phase별)

| Phase | 내용 | 상태 |
|-------|------|------|
| **1** | Three.js 씬 + 주인공 + 좌우 드래그 + 자동 전진 | ✅ 완료 (HTML 프로토타입 있음) |
| **2** | 친구 군단 + 포메이션 따라오기 | 진행 예정 |
| **3** | 게이트 시스템 (+10 / x2 / x3 / -5) | |
| **4** | 자동 사격 + 적 등장 + 충돌 처리 | |
| **5** | 보스 + HUD + 게임오버/클리어 | |
| **6** | 사운드 + 파티클 + 폴리싱 | |
| **7** | 스테이지 시스템 + localStorage 저장 | |
| **8** | 이미지/3D 모델 교체 (나노바나나 + threejs.org/examples) | |

## 💾 localStorage 스키마

```javascript
{
  "mumuwar_v1": {
    "highScore": 12500,
    "stagesCleared": [1, 2, 3],
    "settings": {
      "sound": true,
      "vibration": true,
      "sensitivity": 1.0
    },
    "totalPlays": 42,
    "lastPlayed": "2026-05-25T13:00:00Z"
  }
}
```

## 🦹 빌런 라인업 (2026 초등학생 어려움 데이터 기반)

| 등급 | 빌런 | 모티프 | 통계 근거 |
|------|------|--------|----------|
| 잡몹 | 숙제더미 📚 | 끝없는 학원 숙제 | 학원 가는 아이 54% |
| 잡몹 | 잔소리 풍선 💬 | "공부해라" | 공부 고민 76% |
| 중간보스 | 사이버 트롤 💀 | 사이버폭력 | 사이버폭력 증가세 |
| 중간보스 | 스마트폰 좀비 📱 | 폰 중독 | 과의존 21만 명 |
| **최종 보스** | **학교폭력 우두머리** 👊 | 폭력 화신 | 초등 피해 12.5%, 2.5배 급증 |

## 📐 코드 컨벤션

- **주석**: 한국어
- **변수/함수/컴포넌트**: 영어
- **게임 루프**: requestAnimationFrame 단일 진입점 (`Engine.tick()`)
- **3D 오브젝트**: InstancedMesh 적극 활용 (군단 100명도 60fps 목표)
- **상태**: React 상태는 메뉴/HUD만, 게임 내부는 game/ 내 객체로
- **단위 테스트**: 핵심 유틸 (formation 계산, 게이트 효과)만

## 🦶 푸터 (필수)

```jsx
<footer className="text-center pb-6 text-xs" style={{color:'#64748b'}}>
  © 2026 <a href="https://mumuclass.kr" style={{color:'#64748b'}}>무궁무진클래스</a> · 용쌤
</footer>
```

## ⚙️ 성능 가이드라인

- 목표 60fps (태블릿 기준)
- 군단 인원 최대 200명 → InstancedMesh 필수
- 적 오브젝트 풀링 (생성/파괴 반복 금지)
- 그림자맵 1024 (2048 안 씀)
- DRACO/GLTF 압축 (3D 모델 교체 시)

## 🚫 금지사항

- ❌ README.md 자동 생성
- ❌ 이 CLAUDE.md 무단 수정 (변경 시 용쌤에게 확인)
- ❌ localStorage에 이미지/3D 모델 저장
- ❌ React Three Fiber 도입 (이미 Vanilla Three.js로 시작했음 — 일관성)
- ❌ 학교폭력 묘사를 잔혹하게 표현 (만화적 톤 유지)

## 📦 외부 에셋 가이드

### 이미지 (나노바나나)
- 캐릭터/배경 PNG → `/public/assets/sprites/`
- 픽셀아트 + Y2K 톤 (용쌤 시그니처)
- 1024×1024 정사각, 투명 배경

### 3D 모델 (선택)
- threejs.org/examples 참고
- GLTF/GLB 형식, `/public/assets/models/`
- 폴리곤 1만개 이하 (모바일 고려)

### 사운드
- CC0 라이선스만 (freesound.org)
- BGM: 1곡 (반복), 30초 이내 루프
- SFX: 발사·게이트·충돌·게임오버 4종

## 🔗 관련 리소스

- Three.js 공식: https://threejs.org/
- 예제: https://threejs.org/examples/
- 레퍼런스 영상: Last War: Survival 광고 검색
- 무궁무진클래스: https://mumuclass.kr

---

**📝 최종 업데이트**: 2026-05-25
**📌 현재 단계**: Phase 1 완료, Phase 2 진행 예정
