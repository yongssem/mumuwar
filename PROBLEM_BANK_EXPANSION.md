# 📚 무궁무진 워 — 문제은행 확장 명세 (Phase 8.4)

> v1.0 · 2026-05-25
> 현재 184개 → 목표 **320개+** (학년별 50~80개 보장)

---

## 🎯 확장 목표

| 학년 | 현재 | **목표** | 증가 |
|------|------|--------|------|
| 1학년 | 24 | **80+** | +56 |
| 2학년 | 22 | **80+** | +58 |
| 3학년 | ~100 | 유지 | - |
| 4학년 | 17 | **60+** | +43 |
| 5학년 | 11 | **50+** | +39 |
| 6학년 | 12 | **50+** | +38 |
| **합계** | **184** | **320+** | **+136** |

---

## 🔧 확장 전략

3학년 구구단(`generateMultiplications`)처럼 **알고리즘 생성**을 우선 활용.
응용 문제는 손코딩으로 보완.

---

## 📐 학년별 상세 명세

### 🟢 1학년 (한 자리 ± + 빈칸)

#### 알고리즘 생성 (45 + 45 = 90개)

```javascript
// problems.js
function generateGrade1() {
  const problems = [];
  
  // 한 자리 덧셈 (1~9 + 1~9, 합 ≤ 10)
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      if (a + b <= 10) {
        problems.push({
          q: `${a} + ${b} = ?`,
          a: a + b,
          w: (a + b === 1) ? 2 : (a + b - 1),  // 가까운 오답
          tag: '1-add',
        });
      }
    }
  }
  
  // 한 자리 뺄셈 (a-b, a≤10, b≤a)
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= a; b++) {
      problems.push({
        q: `${a} - ${b} = ?`,
        a: a - b,
        w: (a - b === 0) ? 1 : ((a - b) + 1),
        tag: '1-sub',
      });
    }
  }
  
  return problems;
}
```

#### 손코딩 빈칸 응용 (~15개)

```javascript
const grade1Manual = [
  { q: '□ + 3 = 7', a: 4, w: 3, tag: '1-blank' },
  { q: '5 + □ = 9', a: 4, w: 3, tag: '1-blank' },
  { q: '□ - 2 = 5', a: 7, w: 6, tag: '1-blank' },
  { q: '8 - □ = 3', a: 5, w: 4, tag: '1-blank' },
  { q: '6 + □ = 10', a: 4, w: 3, tag: '1-blank' },
  { q: '□ + □ = 8 (같은 수)', a: 4, w: 3, tag: '1-blank' },
  { q: '10 - □ = 6', a: 4, w: 5, tag: '1-blank' },
  // ... 8개 더
];
```

**1학년 총: 90 + 15 = 약 105개**

---

### 🟡 2학년 (두 자리 ± + 구구단 도입)

#### 알고리즘 생성 (60+개)

```javascript
function generateGrade2() {
  const problems = [];
  
  // 두 자리 덧셈 (10~50 + 10~50, 합 100 이하)
  // 받아올림 있는/없는 섞기, 20개 랜덤 추출
  for (let i = 0; i < 20; i++) {
    const a = Math.floor(Math.random() * 40) + 10;
    const b = Math.floor(Math.random() * 40) + 10;
    if (a + b > 99) continue;
    problems.push({
      q: `${a} + ${b} = ?`,
      a: a + b,
      w: a + b + (Math.random() > 0.5 ? 10 : -10),
      tag: '2-add',
    });
  }
  
  // 두 자리 뺄셈 (a-b, a∈[20,99], b∈[10,a-1])
  for (let i = 0; i < 20; i++) {
    const a = Math.floor(Math.random() * 80) + 20;
    const b = Math.floor(Math.random() * (a - 11)) + 10;
    problems.push({
      q: `${a} - ${b} = ?`,
      a: a - b,
      w: (a - b) + (Math.random() > 0.5 ? 10 : -10),
      tag: '2-sub',
    });
  }
  
  // 구구단 2~5단 (16개)
  for (let dan = 2; dan <= 5; dan++) {
    for (let n = 2; n <= 5; n++) {
      problems.push({
        q: `${dan} × ${n} = ?`,
        a: dan * n,
        w: dan * n + (Math.random() > 0.5 ? dan : -dan),
        tag: '2-mul',
      });
    }
  }
  
  return problems;
}
```

#### 손코딩 응용 (~10개)

```javascript
const grade2Manual = [
  { q: '17 + □ = 25', a: 8, w: 7, tag: '2-blank' },
  { q: '□ - 12 = 18', a: 30, w: 28, tag: '2-blank' },
  { q: '4 × □ = 20', a: 5, w: 4, tag: '2-blank' },
  { q: '□ × 3 = 18', a: 6, w: 5, tag: '2-blank' },
  // 시계 (시 단위만 — 텍스트로)
  { q: '3시에서 2시간 후', a: 5, w: 4, tag: '2-time' },
  { q: '7시 30분에서 1시간 전', a: '6시 30분', w: '7시 30분', tag: '2-time' },
  // 길이 단위 (cm/m 변환 기초)
  { q: '100cm = ?m', a: 1, w: 10, tag: '2-len' },
  { q: '2m = ?cm', a: 200, w: 20, tag: '2-len' },
  // ... 추가
];
```

**2학년 총: 60 + 10 = 약 70~80개** (현재 22 → 3배+)

---

### 🟣 3학년 — 유지 (이미 충분)

기존 그대로. 단 약점 영역 보완:

```javascript
// 추가 (필요시)
const grade3Extra = [
  { q: '15 ÷ □ = 3', a: 5, w: 4, tag: '3-blank' },
  { q: '□ ÷ 4 = 9', a: 36, w: 32, tag: '3-blank' },
  // ... 빈칸 5개 추가
];
```

---

### 🔵 4학년 (큰 수 + 분수 도입)

#### 알고리즘 생성 (40~50개)

```javascript
function generateGrade4() {
  const problems = [];
  
  // 큰 수 곱셈 (2자리 × 1자리, 12개)
  for (let i = 0; i < 12; i++) {
    const a = Math.floor(Math.random() * 80) + 20;
    const b = Math.floor(Math.random() * 7) + 2;
    problems.push({
      q: `${a} × ${b} = ?`,
      a: a * b,
      w: a * b + (Math.random() > 0.5 ? 10 : -10),
      tag: '4-mul',
    });
  }
  
  // 4자리 덧셈 (10개)
  for (let i = 0; i < 10; i++) {
    const a = Math.floor(Math.random() * 9000) + 1000;
    const b = Math.floor(Math.random() * 9000) + 1000;
    problems.push({
      q: `${a} + ${b} = ?`,
      a: a + b,
      w: a + b + (Math.random() > 0.5 ? 100 : -100),
      tag: '4-add4',
    });
  }
  
  // 4자리 뺄셈 (10개)
  for (let i = 0; i < 10; i++) {
    const a = Math.floor(Math.random() * 5000) + 4000;
    const b = Math.floor(Math.random() * (a - 1000)) + 1000;
    problems.push({
      q: `${a} - ${b} = ?`,
      a: a - b,
      w: (a - b) + (Math.random() > 0.5 ? 100 : -100),
      tag: '4-sub4',
    });
  }
  
  return problems;
}
```

#### 손코딩 응용 (~20개)

```javascript
const grade4Manual = [
  // 나눗셈 응용
  { q: '125 × 4 = ?', a: 500, w: 480, tag: '4-mul' },
  { q: '256 × 3 = ?', a: 768, w: 758, tag: '4-mul' },
  { q: '72 ÷ 6 = ?', a: 12, w: 14, tag: '4-div' },
  { q: '144 ÷ 12 = ?', a: 12, w: 11, tag: '4-div' },
  
  // 분수 도입 (기본 비교)
  { q: '1/2 와 같은 것은?', a: '2/4', w: '1/3', tag: '4-frac' },
  { q: '1/4 + 1/4 = ?', a: '2/4', w: '1/4', tag: '4-frac' },
  { q: '3/5 - 1/5 = ?', a: '2/5', w: '4/5', tag: '4-frac' },
  
  // 소수 도입
  { q: '0.5 + 0.3 = ?', a: 0.8, w: 0.6, tag: '4-dec' },
  { q: '0.5 × 6 = ?', a: 3.0, w: 2.5, tag: '4-dec' },
  { q: '1.2 - 0.5 = ?', a: 0.7, w: 0.8, tag: '4-dec' },
  
  // 길이 (km/m)
  { q: '1km = ?m', a: 1000, w: 100, tag: '4-len' },
  { q: '2500m = ?km ?m', a: '2km 500m', w: '25km', tag: '4-len' },
  
  // 시간 (시 → 분)
  { q: '1시간 30분 = ?분', a: 90, w: 130, tag: '4-time' },
  { q: '180초 = ?분', a: 3, w: 18, tag: '4-time' },
  
  // 각도 (직각, 예각, 둔각)
  { q: '직각은 몇 도?', a: 90, w: 100, tag: '4-angle' },
  { q: '60도는 무슨 각?', a: '예각', w: '둔각', tag: '4-angle' },
  
  // 빈칸
  { q: '□ × 8 = 96', a: 12, w: 11, tag: '4-blank' },
  { q: '1234 + □ = 2000', a: 766, w: 766, tag: '4-blank' },
];
```

**4학년 총: 32 + 20 = 약 50~60개** (현재 17 → 3배+)

---

### 🟢 5학년 (분수 사칙 + 약수/배수)

#### 알고리즘 생성 (~30개)

```javascript
function generateGrade5() {
  const problems = [];
  
  // 분수 덧셈 (분모 같음, 10개)
  for (let i = 0; i < 10; i++) {
    const denom = Math.floor(Math.random() * 8) + 3;
    const a = Math.floor(Math.random() * (denom - 1)) + 1;
    const b = Math.floor(Math.random() * (denom - a)) + 1;
    problems.push({
      q: `${a}/${denom} + ${b}/${denom} = ?`,
      a: `${a + b}/${denom}`,
      w: `${a + b}/${denom * 2}`,  // 분모 잘못 더한 오답
      tag: '5-frac-add',
    });
  }
  
  // 분수 뺄셈 (10개)
  for (let i = 0; i < 10; i++) {
    const denom = Math.floor(Math.random() * 8) + 3;
    const a = Math.floor(Math.random() * (denom - 2)) + 2;
    const b = Math.floor(Math.random() * (a - 1)) + 1;
    problems.push({
      q: `${a}/${denom} - ${b}/${denom} = ?`,
      a: `${a - b}/${denom}`,
      w: `${a - b}/${denom - b}`,
      tag: '5-frac-sub',
    });
  }
  
  // 소수 × 자연수 (10개)
  for (let i = 0; i < 10; i++) {
    const dec = (Math.floor(Math.random() * 9) + 1) / 10;
    const n = Math.floor(Math.random() * 8) + 2;
    problems.push({
      q: `${dec} × ${n} = ?`,
      a: parseFloat((dec * n).toFixed(1)),
      w: parseFloat((dec * n + 0.5).toFixed(1)),
      tag: '5-dec-mul',
    });
  }
  
  return problems;
}
```

#### 손코딩 응용 (~25개)

```javascript
const grade5Manual = [
  // 약수/배수
  { q: '12의 약수 개수는?', a: 6, w: 4, tag: '5-divisor' },
  { q: '24와 36의 최대공약수', a: 12, w: 6, tag: '5-gcd' },
  { q: '6과 8의 최소공배수', a: 24, w: 14, tag: '5-lcm' },
  { q: '15의 배수 중 30 이하', a: '15, 30', w: '15, 45', tag: '5-multiple' },
  
  // 분수 × 자연수
  { q: '2/3 × 6 = ?', a: 4, w: 3, tag: '5-frac-mul' },
  { q: '3/4 × 8 = ?', a: 6, w: 5, tag: '5-frac-mul' },
  { q: '1/2 × 10 = ?', a: 5, w: 4, tag: '5-frac-mul' },
  
  // 약분/통분
  { q: '4/8 = ?/2', a: 1, w: 2, tag: '5-frac-simple' },
  { q: '6/9 = 2/?', a: 3, w: 4, tag: '5-frac-simple' },
  
  // 비교 (분수)
  { q: '1/2와 2/3 중 큰 수', a: '2/3', w: '1/2', tag: '5-frac-comp' },
  
  // 도형 둘레
  { q: '한 변 5cm 정사각형 둘레', a: 20, w: 25, tag: '5-perimeter' },
  { q: '가로 7, 세로 3 직사각형 둘레', a: 20, w: 21, tag: '5-perimeter' },
  
  // 넓이 (기본)
  { q: '한 변 6cm 정사각형 넓이', a: 36, w: 24, tag: '5-area' },
  { q: '가로 8, 세로 5 직사각형 넓이', a: 40, w: 13, tag: '5-area' },
  
  // 평균
  { q: '5, 7, 9의 평균', a: 7, w: 6, tag: '5-avg' },
  { q: '10, 20, 30, 40의 평균', a: 25, w: 100, tag: '5-avg' },
];
```

**5학년 총: 30 + 25 = 약 55개** (현재 11 → 5배)

---

### 🔵 6학년 (비례식 + 백분율 + 도형)

#### 알고리즘 생성 (~25개)

```javascript
function generateGrade6() {
  const problems = [];
  
  // 비율 (10개)
  for (let i = 0; i < 10; i++) {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const k = Math.floor(Math.random() * 4) + 2;
    problems.push({
      q: `${a}:${b} = ${a*k}:?`,
      a: b * k,
      w: b * k + 1,
      tag: '6-ratio',
    });
  }
  
  // 백분율 ↔ 분수 (10개)
  const percentages = [10, 20, 25, 50, 75, 30, 40, 60, 80, 90];
  percentages.forEach(p => {
    problems.push({
      q: `${p}%를 분수로`,
      a: `${p}/100`,
      w: `${p}/10`,
      tag: '6-percent',
    });
  });
  
  return problems;
}
```

#### 손코딩 응용 (~30개)

```javascript
const grade6Manual = [
  // 비례식 응용
  { q: '3:5 = 6:?', a: 10, w: 12, tag: '6-ratio' },
  { q: '4:7 = ?:14', a: 8, w: 11, tag: '6-ratio' },
  
  // 원주율 + 원
  { q: '원주율은 약?', a: 3.14, w: 3.41, tag: '6-pi' },
  { q: '반지름 5cm 원의 둘레 (π=3.14)', a: 31.4, w: 15.7, tag: '6-circle' },
  { q: '반지름 10cm 원의 넓이 (π=3.14)', a: 314, w: 100, tag: '6-circle' },
  
  // 부피
  { q: '가로2 세로3 높이4 직육면체 부피', a: 24, w: 9, tag: '6-volume' },
  { q: '한 변 5cm 정육면체 부피', a: 125, w: 25, tag: '6-volume' },
  
  // 백분율 응용
  { q: '100명 중 20명 = ?%', a: 20, w: 2, tag: '6-percent' },
  { q: '50의 30%는?', a: 15, w: 25, tag: '6-percent' },
  { q: '200의 25%는?', a: 50, w: 75, tag: '6-percent' },
  
  // 비례 응용 (실생활)
  { q: '사과 3개 1500원, 5개는?', a: 2500, w: 3000, tag: '6-ratio-real' },
  { q: '60km/h로 2.5시간 가면?', a: '150km', w: '120km', tag: '6-speed' },
  
  // 거듭제곱 (간단)
  { q: '2의 3제곱', a: 8, w: 6, tag: '6-power' },
  { q: '5의 2제곱', a: 25, w: 10, tag: '6-power' },
  { q: '10의 3제곱', a: 1000, w: 300, tag: '6-power' },
  
  // 분수 ÷ 분수 (기본)
  { q: '1/2 ÷ 1/4 = ?', a: 2, w: '1/8', tag: '6-frac-div' },
  { q: '3/4 ÷ 1/2 = ?', a: '3/2', w: '3/8', tag: '6-frac-div' },
];
```

**6학년 총: 25 + 30 = 약 55개** (현재 12 → 4배+)

---

## 📊 최종 합계

| 학년 | 알고리즘 | 손코딩 | 합계 | 현재 대비 |
|------|--------|------|------|---------|
| 1학년 | 90 | 15 | **105** | +81 |
| 2학년 | 60 | 10 | **70** | +48 |
| 3학년 | (유지) | +5 | **105** | +5 |
| 4학년 | 32 | 20 | **52** | +35 |
| 5학년 | 30 | 25 | **55** | +44 |
| 6학년 | 25 | 30 | **55** | +43 |
| **합계** | **237** | **105** | **342** | **+158** |

**최종 목표 320개+ 달성!** ✅

---

## 🛠️ 작업 체크리스트

| # | 작업 | 난이도 | 시간 |
|---|------|------|----|
| 1 | `generateGrade1()` 알고리즘 (한자리 ±) | 🟢 쉬움 | 20분 |
| 2 | 1학년 손코딩 15개 + tag 부여 | 🟢 쉬움 | 15분 |
| 3 | `generateGrade2()` 알고리즘 (두자리 ±, 2~5단) | 🟢 쉬움 | 30분 |
| 4 | 2학년 손코딩 10개 (시계, 길이, 빈칸) | 🟢 쉬움 | 15분 |
| 5 | `generateGrade4()` 알고리즘 (2×1, 4자리 ±) | 🟡 보통 | 30분 |
| 6 | 4학년 손코딩 20개 (분수/소수/시간/길이/각도) | 🟡 보통 | 30분 |
| 7 | `generateGrade5()` 알고리즘 (분수 같은분모, 소수×자연수) | 🟡 보통 | 40분 |
| 8 | 5학년 손코딩 25개 (약수/배수, 넓이, 평균) | 🟡 보통 | 35분 |
| 9 | `generateGrade6()` 알고리즘 (비율, 백분율) | 🟡 보통 | 30분 |
| 10 | 6학년 손코딩 30개 (원, 부피, 거듭제곱) | 🟡 보통 | 40분 |
| 11 | tag 시스템 정비 (학년-영역) - 약점 분석용 | 🟢 쉬움 | 15분 |

**총 약 5시간 작업**

---

## 🏷️ tag 시스템 (약점 분석 활용)

기존 problems.js의 `tag` 필드 활용해서 학년 종합 평가서에 표시:

```javascript
// 약점 영역 자동 감지
function detectWeakAreas(accuracyByTag) {
  return Object.entries(accuracyByTag)
    .filter(([tag, stats]) => stats.rate < 0.6)
    .map(([tag]) => translateTag(tag));
}

const tagTranslations = {
  '3-mul-7': '구구단 7단',
  '3-div': '나눗셈',
  '5-frac-add': '분수 덧셈',
  '6-percent': '백분율',
  // ...
};
```

---

## ⚠️ 주의사항

### 오답 생성 규칙

각 문제의 오답(`w`)은:
- 정답과 자릿수 같게 (1자리 ↔ 1자리, 2자리 ↔ 2자리)
- 정답에서 ±1, ±2, 또는 흔한 실수
- 분수: 분모 다른 것보다 분자 다른 것 (실제 학생 실수 패턴)
- 소수: 소수점 위치 실수 패턴 (0.5 → 5, 0.05)

### 연속 출제 회피 유지

기존 `resetProblemHistory()` 시스템 그대로 활용. 최근 6개 캐시 유지.

### 학년별 명확한 격차

- 1학년 < 한 자리 (≤10)
- 2학년 < 두 자리 (≤100)
- 3학년 < 구구단 (≤100, ÷ 포함)
- 4학년 < 큰 수 (≤10000), 분수/소수 도입
- 5학년 < 분수 사칙
- 6학년 < 비례, 백분율, 도형

---

## 📋 클로드 코드 메시지 템플릿

```
GAME_DESIGN.md와 별개로 PROBLEM_BANK_EXPANSION.md 명세 줬어.
Phase 8.4 진행: 문제은행 184개 → 320개+로 확장.

[방식]
- 알고리즘 생성 우선 (3학년 구구단 함수처럼)
- 응용 문제는 손코딩
- tag 시스템 정비 (약점 분석용)

[학년별 목표]
- 1학년: 24 → 105 (한자리 ±, 빈칸)
- 2학년: 22 → 70 (두자리 ±, 2~5단)
- 3학년: 유지 + 빈칸 5개
- 4학년: 17 → 52 (2×1, 4자리 ±, 분수/소수 도입)
- 5학년: 11 → 55 (분수 사칙, 약수/배수)
- 6학년: 12 → 55 (비례, 백분율, 도형)

[작업 순서]
1. generateGrade1() 알고리즘
2. 1학년 손코딩 + tag
3. generateGrade2() 알고리즘
4. 2학년 손코딩
5. 4학년 (알고리즘 + 손코딩)
6. 5학년 (알고리즘 + 손코딩)
7. 6학년 (알고리즘 + 손코딩)
8. tag 시스템 정비

기존 problems.js의 연속 출제 회피, resetProblemHistory() 그대로 유지.
다 한 번에 처리하고 끝나면 알려줘.
```
