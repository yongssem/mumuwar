# 🎵 무궁무진 워 — 사운드 제작 가이드

> Suno AI BGM 생성 프롬프트 + CC0 SFX 다운로드 가이드
> v1.0 · 2026-05-25

---

## 🎯 사운드 전체 구성

| 파일명 | 종류 | 길이 | 용도 | 제작 |
|--------|------|------|------|------|
| `bgm-main.mp3` | BGM | 90초 (루프) | 인게임 메인 | Suno |
| `bgm-menu.mp3` | BGM | 60초 (루프) | 시작화면 | Suno |
| `bgm-boss.mp3` | BGM | 90초 (루프) | 10스테이지 보스 | Suno |
| `bgm-ending.mp3` | BGM | 40초 | 엔딩 | Suno |
| `sfx-shoot.mp3` | SFX | 0.3초 | 책 던지기 | CC0 |
| `sfx-correct.mp3` | SFX | 0.5초 | 정답 게이트 | CC0 |
| `sfx-wrong.mp3` | SFX | 0.5초 | 오답 게이트 | CC0 |
| `sfx-kill.mp3` | SFX | 0.3초 | 적 처치 | CC0 |
| `sfx-recruit.mp3` | SFX | 0.5초 | 친구 합류 | CC0 |
| `sfx-boss-die.mp3` | SFX | 1.5초 | 보스 처치 | CC0 |

> 폴더 구조: `public/assets/sounds/` 아래 통째로 배치

---

# 🎹 PART 1: Suno AI BGM 프롬프트

## 📌 Suno 사용법 (3단계)

1. **https://suno.com** 접속 → 구글 계정 로그인 (무료, 하루 10곡)
2. **"Create" 버튼** → "Custom" 모드 선택
3. **Style** 칸에 아래 프롬프트 복붙 + **Instrumental** 체크 (가사 없음)
4. 생성된 곡 중 마음에 드는 거 다운로드 → mp3 파일

> 💡 한 프롬프트로 2곡씩 자동 생성됨. 마음에 안 들면 같은 프롬프트로 재생성 가능.

---

## 🎵 곡 1: 메인 BGM (`bgm-main.mp3`)

### Suno Style 프롬프트

```
upbeat K-pop game soundtrack, energetic 8-bit electronic, 130 BPM,
bright synth lead, punchy drums, cheerful and exciting,
hyper-casual mobile game vibe, similar to Subway Surfers,
catchy melody loop, no vocals, instrumental
```

### 한국어 버전 (대안)

```
신나는 K팝 게임 사운드트랙, 8비트 일렉트로닉, 130 BPM,
밝은 신스 멜로디, 펀치감 있는 드럼, 경쾌하고 흥미진진,
서브웨이서퍼즈 느낌의 하이퍼캐주얼 모바일게임, 가사 없음
```

### 톤 가이드

- ⚡ 에너지 레벨: **8/10** (학생들이 텐션 받게)
- 🎯 목표: 들으면 손가락 까딱까딱하게
- 🚫 금지: 우울/어두운/너무 격렬한 톤
- ✅ 참고: 쿠키런, 서브웨이 서퍼즈, 카트라이더 메인 BGM

---

## 🎵 곡 2: 메뉴 BGM (`bgm-menu.mp3`)

### Suno Style 프롬프트

```
relaxing chiptune menu music, gentle 8-bit synth, 90 BPM,
playful and welcoming, soft melody, school cafeteria vibe,
hyper-casual game menu screen, calm but cheerful, no vocals, instrumental
```

### 톤 가이드

- ⚡ 에너지 레벨: **4/10** (선택하는 동안 마음 편하게)
- 🎯 목표: 게임 시작 전 기대감 조성
- ✅ 참고: 동물의 숲 메뉴 화면, 모여봐요 동숲

---

## 🎵 곡 3: 보스 BGM (`bgm-boss.mp3`)

### Suno Style 프롬프트

```
intense epic boss battle music, dramatic orchestral with electronic drums,
140 BPM, urgent tension, heroic strings, powerful percussion,
final showdown mobile game, building intensity, no vocals, instrumental
```

### 톤 가이드

- ⚡ 에너지 레벨: **10/10** (긴장감 MAX)
- 🎯 목표: "이번이 마지막이다!" 느낌
- 🚫 금지: 너무 무섭거나 공포스러운 톤 (초등학생 타깃)
- ✅ 참고: 슈퍼마리오 보스전, 어드벤처 게임 클라이맥스

---

## 🎵 곡 4: 엔딩 BGM (`bgm-ending.mp3`)

### Suno Style 프롬프트

```
heartwarming victory music, gentle piano with strings,
80 BPM, hopeful and emotional, friendship theme,
school graduation feel, peaceful resolution after battle,
warm and uplifting, no vocals, instrumental
```

### 톤 가이드

- ⚡ 에너지 레벨: **5/10** (감동적 / 따뜻함)
- 🎯 목표: "혼자가 아니야" 메시지와 어울림
- 🚫 금지: 슬픈 톤 (희망적이어야)
- ✅ 참고: 픽사 영화 엔딩 크레딧, 졸업식 분위기

---

## 🎨 Suno 활용 꿀팁

### ✅ 좋은 결과 얻는 법

| 팁 | 설명 |
|----|------|
| **BPM 명시** | 정확한 템포 지정하면 게임 사운드답게 나옴 |
| **"no vocals" 필수** | 게임 BGM에 가사 있으면 산만함 |
| **"instrumental" 명시** | 위와 같은 이유로 한 번 더 강조 |
| **참고곡 언급** | "similar to ___" 형식으로 명확한 방향 제시 |
| **2~3곡 비교** | 한 프롬프트로 만든 후 마음에 드는 것 선택 |

### ⚠️ 주의사항

- **저작권**: Suno 무료 플랜은 **비상업적 사용만 가능**. 상업적 배포는 Pro 플랜 ($10/월) 필요
- **저장 형식**: mp3로 다운로드 (Suno 기본 제공)
- **파일 크기**: 보통 1~3MB. 무궁무진 워는 4곡 합쳐서 10MB 이하 유지

---

# 🔊 PART 2: CC0 SFX 다운로드 가이드

## 📌 추천 사이트 3곳

### 1. **freesound.org** ⭐ 1순위
- 가입 후 무료 다운로드
- 라이선스: CC0 또는 CC BY 필터 선택
- 검색 팁: 영어로 검색 ("hit", "click", "correct")

### 2. **opengameart.org**
- 게임용 SFX 특화
- 라이선스: CC0 다수
- 팩 단위 다운로드 가능

### 3. **mixkit.co**
- 무료 + 상업적 사용 OK
- 효과음 카테고리별 정리 잘 됨

---

## 🎯 SFX별 검색 키워드

### `sfx-shoot.mp3` (책 던지기)

| 사이트 | 검색어 |
|--------|--------|
| freesound | `whoosh short` / `paper throw` / `swing fast` |
| opengameart | `pew sound` / `magic throw` |

**선택 기준**: 0.3초 이내, 가볍고 경쾌한 느낌. 무거운 총소리 X

---

### `sfx-correct.mp3` (정답 게이트)

| 사이트 | 검색어 |
|--------|--------|
| freesound | `correct answer chime` / `success ding` / `quiz right` |
| mixkit | `game success` / `notification positive` |

**선택 기준**: 청량한 종소리, "띵!" 또는 "딩동!" 느낌

---

### `sfx-wrong.mp3` (오답 게이트)

| 사이트 | 검색어 |
|--------|--------|
| freesound | `wrong answer buzz` / `error sound` / `quiz fail` |
| mixkit | `game error` / `wrong notification` |

**선택 기준**: 너무 무겁지 않은 부저음 ("부우~" 정도). 학생 상처받지 않게

---

### `sfx-kill.mp3` (적 처치)

| 사이트 | 검색어 |
|--------|--------|
| freesound | `pop sound` / `cartoon hit` / `puff explosion` |
| opengameart | `enemy defeat` / `small explosion` |

**선택 기준**: 만화적인 "퐁!" 또는 "팡!". 잔혹한 효과 X

---

### `sfx-recruit.mp3` (친구 합류)

| 사이트 | 검색어 |
|--------|--------|
| freesound | `pickup item` / `coin collect` / `power up short` |
| mixkit | `game level up` / `bonus collect` |

**선택 기준**: 위로 올라가는 음정 ("도→솔" 같은 상승음)

---

### `sfx-boss-die.mp3` (보스 처치)

| 사이트 | 검색어 |
|--------|--------|
| freesound | `victory fanfare short` / `boss defeat` / `level clear` |
| mixkit | `game win` / `victory sound` |

**선택 기준**: 1~1.5초, 환호 + 광채 느낌. 화려하게

---

## 📦 SFX 다운로드 체크리스트

다운로드 후 확인할 것:

```
□ 라이선스가 CC0 또는 CC BY인가? (CC BY는 크레딧 표시 필수)
□ 파일 형식이 mp3 또는 wav인가?
□ 길이가 적절한가? (SFX는 1.5초 이내)
□ 볼륨이 너무 크지 않은가? (필요시 Audacity로 조정)
□ 파일명을 위 규칙대로 변경했는가?
```

---

# 🛠️ PART 3: 코드 통합 (참고용)

## Three.js + Howler.js 추천

게임 사운드 처리는 **Howler.js**가 표준입니다. Three.js와 함께 잘 작동해요.

### 설치 (Phase 6에서 적용)

```bash
npm i howler
```

### 사용 예시

```javascript
// src/game/utils/audio.js
import { Howl, Howler } from 'howler';

export const sounds = {
  bgmMain: new Howl({
    src: ['/assets/sounds/bgm-main.mp3'],
    loop: true,
    volume: 0.4,
  }),
  sfxShoot: new Howl({
    src: ['/assets/sounds/sfx-shoot.mp3'],
    volume: 0.6,
  }),
  sfxCorrect: new Howl({
    src: ['/assets/sounds/sfx-correct.mp3'],
    volume: 0.7,
  }),
  // ... 나머지
};

// 사용
sounds.bgmMain.play();
sounds.sfxShoot.play();
```

### 볼륨 가이드

| 종류 | 권장 볼륨 | 이유 |
|------|----------|------|
| BGM | 0.3~0.4 | 배경이라 작게 |
| SFX 일반 | 0.6~0.7 | 들리되 피곤하지 않게 |
| SFX 보스 처치 | 0.8 | 클라이맥스니까 강하게 |

---

# 📝 작업 순서 (추천)

1. **지금**: Suno 계정 만들기 (구글 로그인 30초)
2. **곡 1 (메인 BGM)** 먼저 생성 → 마음에 들면 다운로드
3. **곡 2~4** 차례로 생성 (계정당 하루 10곡 가능)
4. **SFX 6종** freesound에서 다운로드 (30분 작업)
5. 모든 파일 `public/assets/sounds/`에 넣기
6. Phase 6에서 Howler.js로 연결

총 작업시간 약 **1시간 ~ 1시간 30분**

---

## 🎯 Suno 곡 생성 후 체크리스트

각 곡 다운로드 전 확인:

```
□ 가사가 없는가? (있으면 재생성)
□ 길이가 적절한가? (BGM 60~90초)
□ 처음과 끝이 자연스러운가? (루프용)
□ 음향이 깨끗한가? (지지직거리는 노이즈 X)
□ 게임 톤과 맞는가?
```

---

**🎵 다 만들면 mp3 파일들 압축해서 한 폴더에 넣고 클로드 코드에 던지면 됩니다.**

```
public/assets/sounds/
├── bgm-main.mp3
├── bgm-menu.mp3
├── bgm-boss.mp3
├── bgm-ending.mp3
├── sfx-shoot.mp3
├── sfx-correct.mp3
├── sfx-wrong.mp3
├── sfx-kill.mp3
├── sfx-recruit.mp3
└── sfx-boss-die.mp3
```
