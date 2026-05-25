// GAME_DESIGN v2 §4 — 학년별 수학 문제 풀
// Phase 8.4: 184개 → 320개+ 확장 (알고리즘 생성 + 손코딩 + tag 시스템)
// 오답 규칙 §4-7: 정답과 ±2 이내, 자릿수 같게

// 공통 유틸 — 오답이 정답과 같으면 보정
function ensureWrong(correct, wrong, fallback) {
  if (String(wrong) === String(correct)) return fallback
  return wrong
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 중복 제거 (q 기준)
function dedup(list) {
  const seen = new Set()
  const out = []
  for (const p of list) {
    if (seen.has(p.q)) continue
    seen.add(p.q)
    out.push(p)
  }
  return out
}

// =====================================================================
// 1학년 — 한 자리 ± + 빈칸
// =====================================================================
function generateGrade1() {
  const problems = []

  // 한 자리 덧셈 (a+b ≤ 10, 1≤a,b≤9) — 45개
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      if (a + b <= 10) {
        const ans = a + b
        problems.push({
          q: `${a} + ${b} = ?`,
          a: ans,
          w: ans === 1 ? 2 : ans - 1,
          tag: '1-add',
        })
      }
    }
  }

  // 한 자리 뺄셈 (a-b, 1≤a≤10, 1≤b≤a) — 55개
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= a; b++) {
      const ans = a - b
      problems.push({
        q: `${a} - ${b} = ?`,
        a: ans,
        w: ans === 0 ? 1 : ans + 1,
        tag: '1-sub',
      })
    }
  }

  return problems
}

const grade1Manual = [
  { q: '□ + 3 = 7',  a: 4, w: 3, tag: '1-blank' },
  { q: '5 + □ = 9',  a: 4, w: 3, tag: '1-blank' },
  { q: '□ - 2 = 5',  a: 7, w: 6, tag: '1-blank' },
  { q: '8 - □ = 3',  a: 5, w: 4, tag: '1-blank' },
  { q: '6 + □ = 10', a: 4, w: 3, tag: '1-blank' },
  { q: '□ + 4 = 9',  a: 5, w: 6, tag: '1-blank' },
  { q: '10 - □ = 6', a: 4, w: 5, tag: '1-blank' },
  { q: '□ + □ = 8 (같은 수)', a: 4, w: 3, tag: '1-blank' },
  { q: '7 - □ = 4',  a: 3, w: 4, tag: '1-blank' },
  { q: '□ + 5 = 8',  a: 3, w: 4, tag: '1-blank' },
  { q: '9 - □ = 2',  a: 7, w: 6, tag: '1-blank' },
  { q: '□ - 4 = 3',  a: 7, w: 8, tag: '1-blank' },
  { q: '2 + □ = 7',  a: 5, w: 6, tag: '1-blank' },
  { q: '□ + 6 = 9',  a: 3, w: 4, tag: '1-blank' },
  { q: '10 - □ = 4', a: 6, w: 5, tag: '1-blank' },
]

// =====================================================================
// 2학년 — 두 자리 ± + 2~5단 + 시계/길이
// =====================================================================
function generateGrade2() {
  const problems = []

  // 두 자리 덧셈 (a+b ≤ 99) — 시드 기반 25개
  const usedAdd = new Set()
  while (usedAdd.size < 25) {
    const a = randInt(10, 49)
    const b = randInt(10, 49)
    if (a + b > 99) continue
    const key = `${a}+${b}`
    if (usedAdd.has(key)) continue
    usedAdd.add(key)
    const ans = a + b
    const w = ans + (Math.random() > 0.5 ? 10 : -10)
    problems.push({
      q: `${a} + ${b} = ?`,
      a: ans,
      w: ensureWrong(ans, w, ans + 1),
      tag: '2-add',
    })
  }

  // 두 자리 뺄셈 — 25개
  const usedSub = new Set()
  while (usedSub.size < 25) {
    const a = randInt(20, 99)
    const b = randInt(10, a - 1)
    const key = `${a}-${b}`
    if (usedSub.has(key)) continue
    usedSub.add(key)
    const ans = a - b
    const w = ans + (Math.random() > 0.5 ? 10 : -10)
    problems.push({
      q: `${a} - ${b} = ?`,
      a: ans,
      w: ensureWrong(ans, w < 0 ? ans + 10 : w, ans + 1),
      tag: '2-sub',
    })
  }

  // 구구단 2~5단 (각 단 2~9 = 4단×8 = 32개)
  for (let dan = 2; dan <= 5; dan++) {
    for (let n = 2; n <= 9; n++) {
      const ans = dan * n
      problems.push({
        q: `${dan} × ${n} = ?`,
        a: ans,
        w: ans + (Math.random() > 0.5 ? dan : -dan),
        tag: `2-mul-${dan}`,
      })
    }
  }

  return problems
}

const grade2Manual = [
  { q: '17 + □ = 25', a: 8,  w: 7,  tag: '2-blank' },
  { q: '□ - 12 = 18', a: 30, w: 28, tag: '2-blank' },
  { q: '4 × □ = 20',  a: 5,  w: 4,  tag: '2-blank' },
  { q: '□ × 3 = 18',  a: 6,  w: 5,  tag: '2-blank' },
  { q: '3시에서 2시간 후',    a: '5시',     w: '4시',     tag: '2-time' },
  { q: '7시 30분에서 1시간 전', a: '6시 30분', w: '8시 30분', tag: '2-time' },
  { q: '100cm = ?m',  a: 1,   w: 10,  tag: '2-len' },
  { q: '2m = ?cm',    a: 200, w: 20,  tag: '2-len' },
  { q: '1m = ?cm',    a: 100, w: 10,  tag: '2-len' },
  { q: '300cm = ?m',  a: 3,   w: 30,  tag: '2-len' },
]

// =====================================================================
// 3학년 — 구구단 2~9단 + 나눗셈 + 두자리 ± + 빈칸 (기존 유지)
// =====================================================================
function generateGrade3Mul() {
  const out = []
  for (let a = 2; a <= 9; a++) {
    for (let b = 2; b <= 9; b++) {
      const ans = a * b
      let w = ans + (Math.random() < 0.5 ? -2 : 2)
      if (w < 0) w = ans + 2
      out.push({ q: `${a} × ${b} = ?`, a: ans, w, tag: `3-mul-${a}` })
    }
  }
  return out
}

const grade3Div = [
  { q: '12 ÷ 3 = ?', a: 4, w: 5, tag: '3-div' },
  { q: '15 ÷ 5 = ?', a: 3, w: 4, tag: '3-div' },
  { q: '18 ÷ 6 = ?', a: 3, w: 4, tag: '3-div' },
  { q: '20 ÷ 4 = ?', a: 5, w: 6, tag: '3-div' },
  { q: '21 ÷ 7 = ?', a: 3, w: 4, tag: '3-div' },
  { q: '24 ÷ 6 = ?', a: 4, w: 5, tag: '3-div' },
  { q: '28 ÷ 4 = ?', a: 7, w: 8, tag: '3-div' },
  { q: '32 ÷ 8 = ?', a: 4, w: 5, tag: '3-div' },
  { q: '35 ÷ 5 = ?', a: 7, w: 6, tag: '3-div' },
  { q: '36 ÷ 6 = ?', a: 6, w: 5, tag: '3-div' },
  { q: '42 ÷ 7 = ?', a: 6, w: 7, tag: '3-div' },
  { q: '45 ÷ 5 = ?', a: 9, w: 8, tag: '3-div' },
  { q: '48 ÷ 6 = ?', a: 8, w: 9, tag: '3-div' },
  { q: '54 ÷ 9 = ?', a: 6, w: 7, tag: '3-div' },
  { q: '56 ÷ 7 = ?', a: 8, w: 9, tag: '3-div' },
  { q: '63 ÷ 9 = ?', a: 7, w: 8, tag: '3-div' },
  { q: '64 ÷ 8 = ?', a: 8, w: 7, tag: '3-div' },
  { q: '72 ÷ 8 = ?', a: 9, w: 8, tag: '3-div' },
  { q: '81 ÷ 9 = ?', a: 9, w: 8, tag: '3-div' },
]

const grade3Add = [
  { q: '24 + 38 = ?', a: 62,  w: 52,  tag: '3-add' },
  { q: '36 + 27 = ?', a: 63,  w: 53,  tag: '3-add' },
  { q: '45 + 29 = ?', a: 74,  w: 64,  tag: '3-add' },
  { q: '58 + 36 = ?', a: 94,  w: 84,  tag: '3-add' },
  { q: '67 + 25 = ?', a: 92,  w: 82,  tag: '3-add' },
  { q: '73 + 18 = ?', a: 91,  w: 81,  tag: '3-add' },
  { q: '82 + 19 = ?', a: 101, w: 91,  tag: '3-add' },
  { q: '94 - 37 = ?', a: 57,  w: 47,  tag: '3-sub' },
  { q: '85 - 28 = ?', a: 57,  w: 47,  tag: '3-sub' },
  { q: '76 - 19 = ?', a: 57,  w: 67,  tag: '3-sub' },
  { q: '63 - 25 = ?', a: 38,  w: 48,  tag: '3-sub' },
  { q: '52 - 18 = ?', a: 34,  w: 44,  tag: '3-sub' },
  { q: '71 - 26 = ?', a: 45,  w: 55,  tag: '3-sub' },
  { q: '100 - 37 = ?', a: 63, w: 73, tag: '3-sub' },
]

const grade3Blank = [
  { q: '□ × 6 = 42', a: 7,  w: 8,  tag: '3-blank' },
  { q: '8 × □ = 56', a: 7,  w: 8,  tag: '3-blank' },
  { q: '□ ÷ 4 = 9',  a: 36, w: 32, tag: '3-blank' },
  { q: '63 ÷ □ = 7', a: 9,  w: 8,  tag: '3-blank' },
  { q: '□ × 9 = 72', a: 8,  w: 9,  tag: '3-blank' },
  { q: '7 × □ = 49', a: 7,  w: 8,  tag: '3-blank' },
  // 명세에서 요구한 빈칸 추가 5개
  { q: '15 ÷ □ = 3', a: 5,  w: 4,  tag: '3-blank' },
  { q: '□ ÷ 7 = 6',  a: 42, w: 49, tag: '3-blank' },
  { q: '□ × 4 = 32', a: 8,  w: 7,  tag: '3-blank' },
  { q: '□ ÷ 8 = 4',  a: 32, w: 24, tag: '3-blank' },
  { q: '24 ÷ □ = 6', a: 4,  w: 3,  tag: '3-blank' },
]

// =====================================================================
// 4학년 — 큰 수 곱셈 + 4자리 ± + 분수/소수 도입
// =====================================================================
function generateGrade4() {
  const problems = []

  // 2자리 × 1자리 (12개)
  const seen = new Set()
  while (seen.size < 12) {
    const a = randInt(20, 99)
    const b = randInt(2, 8)
    const key = `${a}*${b}`
    if (seen.has(key)) continue
    seen.add(key)
    const ans = a * b
    const w = ans + (Math.random() > 0.5 ? 10 : -10)
    problems.push({
      q: `${a} × ${b} = ?`,
      a: ans,
      w: ensureWrong(ans, w, ans + 1),
      tag: '4-mul',
    })
  }

  // 4자리 덧셈 (10개)
  const seenAdd = new Set()
  while (seenAdd.size < 10) {
    const a = randInt(1000, 9999)
    const b = randInt(1000, 9999)
    const key = `${a}+${b}`
    if (seenAdd.has(key)) continue
    seenAdd.add(key)
    const ans = a + b
    const w = ans + (Math.random() > 0.5 ? 100 : -100)
    problems.push({
      q: `${a} + ${b} = ?`,
      a: ans,
      w: ensureWrong(ans, w, ans + 10),
      tag: '4-add4',
    })
  }

  // 4자리 뺄셈 (10개, a≥b 보장)
  const seenSub = new Set()
  while (seenSub.size < 10) {
    const a = randInt(4000, 9000)
    const b = randInt(1000, a - 1000)
    const key = `${a}-${b}`
    if (seenSub.has(key)) continue
    seenSub.add(key)
    const ans = a - b
    const w = ans + (Math.random() > 0.5 ? 100 : -100)
    problems.push({
      q: `${a} - ${b} = ?`,
      a: ans,
      w: ensureWrong(ans, w < 0 ? ans + 100 : w, ans + 10),
      tag: '4-sub4',
    })
  }

  return problems
}

const grade4Manual = [
  // 곱셈 응용
  { q: '125 × 4 = ?',  a: 500, w: 480, tag: '4-mul' },
  { q: '256 × 3 = ?',  a: 768, w: 758, tag: '4-mul' },
  { q: '218 × 2 = ?',  a: 436, w: 426, tag: '4-mul' },
  // 나눗셈 응용
  { q: '72 ÷ 6 = ?',   a: 12, w: 14, tag: '4-div' },
  { q: '144 ÷ 12 = ?', a: 12, w: 11, tag: '4-div' },
  // 분수
  { q: '1/2 와 같은 것은?', a: '2/4', w: '1/3', tag: '4-frac' },
  { q: '1/4 + 1/4 = ?',  a: '2/4', w: '1/4', tag: '4-frac' },
  { q: '3/5 - 1/5 = ?',  a: '2/5', w: '4/5', tag: '4-frac' },
  { q: '2/3 + 1/3 = ?',  a: '3/3', w: '2/3', tag: '4-frac' },
  // 소수
  { q: '0.5 + 0.3 = ?',  a: 0.8, w: 0.6, tag: '4-dec' },
  { q: '0.5 × 6 = ?',    a: 3,   w: 2.5, tag: '4-dec' },
  { q: '1.2 - 0.5 = ?',  a: 0.7, w: 0.8, tag: '4-dec' },
  { q: '1.5 + 2.3 = ?',  a: 3.8, w: 3.6, tag: '4-dec' },
  // 길이
  { q: '1km = ?m',         a: 1000, w: 100, tag: '4-len' },
  { q: '2500m = ?km ?m',   a: '2km 500m', w: '25km', tag: '4-len' },
  // 시간
  { q: '1시간 30분 = ?분',  a: 90, w: 130, tag: '4-time' },
  { q: '180초 = ?분',       a: 3,  w: 18,  tag: '4-time' },
  // 각도
  { q: '직각은 몇 도?',     a: 90, w: 100, tag: '4-angle' },
  { q: '60도는 무슨 각?',   a: '예각', w: '둔각', tag: '4-angle' },
  // 빈칸
  { q: '□ × 8 = 96',       a: 12, w: 11, tag: '4-blank' },
  { q: '1234 + □ = 2000',  a: 766, w: 776, tag: '4-blank' },
]

// =====================================================================
// 5학년 — 분수 사칙 + 약수/배수 + 소수 × 자연수 + 도형
// =====================================================================
function generateGrade5() {
  const problems = []

  // 같은 분모 분수 덧셈 (10개) — 합 < 분모 (가분수 피함)
  const usedFA = new Set()
  while (usedFA.size < 10) {
    const denom = randInt(3, 10)
    const a = randInt(1, denom - 2)
    const b = randInt(1, denom - a - 1)
    const key = `${a}/${denom}+${b}/${denom}`
    if (usedFA.has(key)) continue
    usedFA.add(key)
    problems.push({
      q: `${a}/${denom} + ${b}/${denom} = ?`,
      a: `${a + b}/${denom}`,
      w: `${a + b}/${denom * 2}`,
      tag: '5-frac-add',
    })
  }

  // 같은 분모 분수 뺄셈 (10개)
  const usedFS = new Set()
  while (usedFS.size < 10) {
    const denom = randInt(3, 10)
    const a = randInt(2, denom - 1)
    const b = randInt(1, a - 1)
    const key = `${a}/${denom}-${b}/${denom}`
    if (usedFS.has(key)) continue
    usedFS.add(key)
    problems.push({
      q: `${a}/${denom} - ${b}/${denom} = ?`,
      a: `${a - b}/${denom}`,
      w: `${a - b}/${Math.max(2, denom - b)}`,
      tag: '5-frac-sub',
    })
  }

  // 소수 × 자연수 (10개)
  const usedDM = new Set()
  while (usedDM.size < 10) {
    const tenths = randInt(1, 9)
    const dec = tenths / 10
    const n = randInt(2, 9)
    const key = `${dec}*${n}`
    if (usedDM.has(key)) continue
    usedDM.add(key)
    const ans = parseFloat((dec * n).toFixed(1))
    const w = parseFloat((ans + 0.5).toFixed(1))
    problems.push({
      q: `${dec} × ${n} = ?`,
      a: ans,
      w,
      tag: '5-dec-mul',
    })
  }

  return problems
}

const grade5Manual = [
  // 약수/배수
  { q: '12의 약수 개수는?',      a: 6,  w: 4,  tag: '5-divisor' },
  { q: '24와 36의 최대공약수',   a: 12, w: 6,  tag: '5-gcd' },
  { q: '6과 8의 최소공배수',    a: 24, w: 14, tag: '5-lcm' },
  { q: '18과 24의 최대공약수',   a: 6,  w: 8,  tag: '5-gcd' },
  { q: '3과 5의 최소공배수',    a: 15, w: 20, tag: '5-lcm' },
  { q: '24의 가장 큰 약수',     a: 12, w: 16, tag: '5-divisor' },
  // 분수 × 자연수
  { q: '2/3 × 6 = ?',   a: 4, w: 3, tag: '5-frac-mul' },
  { q: '3/4 × 8 = ?',   a: 6, w: 5, tag: '5-frac-mul' },
  { q: '1/2 × 10 = ?',  a: 5, w: 4, tag: '5-frac-mul' },
  { q: '3/5 × 10 = ?',  a: 6, w: 5, tag: '5-frac-mul' },
  // 약분/통분
  { q: '4/8 = ?/2',     a: 1, w: 2, tag: '5-frac-simple' },
  { q: '6/9 = 2/?',     a: 3, w: 4, tag: '5-frac-simple' },
  // 비교
  { q: '1/2와 2/3 중 큰 수', a: '2/3', w: '1/2', tag: '5-frac-comp' },
  // 통분 분수 사칙
  { q: '2/3 + 1/4 = ?', a: '11/12', w: '3/7', tag: '5-frac-add-uneven' },
  { q: '3/8 + 1/4 = ?', a: '5/8',   w: '4/8', tag: '5-frac-add-uneven' },
  { q: '5/6 - 1/3 = ?', a: '3/6',   w: '4/6', tag: '5-frac-sub-uneven' },
  // 소수 ÷ 소수
  { q: '4.5 ÷ 1.5 = ?', a: 3, w: 2, tag: '5-dec-div' },
  { q: '6.4 ÷ 0.8 = ?', a: 8, w: 7, tag: '5-dec-div' },
  { q: '2.5 × 4 = ?',   a: 10, w: 9, tag: '5-dec-mul' },
  { q: '0.25 × 8 = ?',  a: 2, w: 3, tag: '5-dec-mul' },
  // 도형 둘레
  { q: '한 변 5cm 정사각형 둘레',     a: 20, w: 25, tag: '5-perimeter' },
  { q: '가로 7, 세로 3 직사각형 둘레', a: 20, w: 21, tag: '5-perimeter' },
  // 넓이
  { q: '한 변 6cm 정사각형 넓이',     a: 36, w: 24, tag: '5-area' },
  { q: '가로 8, 세로 5 직사각형 넓이', a: 40, w: 13, tag: '5-area' },
  // 평균
  { q: '5, 7, 9의 평균',            a: 7,  w: 6,   tag: '5-avg' },
  { q: '10, 20, 30, 40의 평균',     a: 25, w: 100, tag: '5-avg' },
]

// =====================================================================
// 6학년 — 비례식 + 백분율 + 도형 + 거듭제곱
// =====================================================================
function generateGrade6() {
  const problems = []

  // 비율 (10개)
  const usedR = new Set()
  while (usedR.size < 10) {
    const a = randInt(1, 9)
    const b = randInt(1, 9)
    const k = randInt(2, 5)
    const key = `${a}:${b}*${k}`
    if (usedR.has(key)) continue
    usedR.add(key)
    problems.push({
      q: `${a}:${b} = ${a * k}:?`,
      a: b * k,
      w: b * k + 1,
      tag: '6-ratio',
    })
  }

  // 백분율 → 분수 (10개)
  const percentages = [10, 20, 25, 50, 75, 30, 40, 60, 80, 90]
  for (const p of percentages) {
    problems.push({
      q: `${p}%를 분수로`,
      a: `${p}/100`,
      w: `${p}/10`,
      tag: '6-percent',
    })
  }

  return problems
}

const grade6Manual = [
  // 비례식
  { q: '3 : 5 = 6 : ?', a: 10, w: 12, tag: '6-ratio' },
  { q: '2 : 7 = ? : 21', a: 6, w: 7,  tag: '6-ratio' },
  { q: '4 : 9 = 12 : ?', a: 27, w: 25, tag: '6-ratio' },
  { q: '4 : 7 = ? : 14', a: 8, w: 11, tag: '6-ratio' },
  // 원주율 + 원
  { q: '원주율은 약?',                     a: 3.14, w: 3.41, tag: '6-pi' },
  { q: '반지름 5cm 원의 둘레 (π=3.14)',     a: 31.4, w: 15.7, tag: '6-circle' },
  { q: '반지름 10cm 원의 넓이 (π=3.14)',    a: 314,  w: 100,  tag: '6-circle' },
  { q: '반지름 5인 원의 넓이 (π=3)',       a: 75,   w: 50,   tag: '6-circle' },
  // 부피
  { q: '가로2 세로3 높이4 직육면체 부피',   a: 24,  w: 9,   tag: '6-volume' },
  { q: '한 변 5cm 정육면체 부피',          a: 125, w: 25,  tag: '6-volume' },
  { q: '한 변 6의 정육면체 부피',          a: 216, w: 196, tag: '6-volume' },
  // 백분율 응용
  { q: '100명 중 20명 = ?%',  a: 20, w: 2,  tag: '6-percent' },
  { q: '50의 30%는?',         a: 15, w: 25, tag: '6-percent' },
  { q: '200의 25%는?',        a: 50, w: 75, tag: '6-percent' },
  { q: '120의 25%',           a: 30, w: 40, tag: '6-percent' },
  { q: '20% × 50 = ?',        a: 10, w: 12, tag: '6-percent' },
  // 비례 실생활
  { q: '사과 3개 1500원, 5개는?',     a: 2500, w: 3000, tag: '6-ratio-real' },
  { q: '60km/h로 2.5시간 가면?',     a: '150km', w: '120km', tag: '6-speed' },
  // 거듭제곱
  { q: '2의 3제곱',  a: 8,    w: 6,   tag: '6-power' },
  { q: '5의 2제곱',  a: 25,   w: 10,  tag: '6-power' },
  { q: '5의 3제곱',  a: 125,  w: 25,  tag: '6-power' },
  { q: '10의 3제곱', a: 1000, w: 300, tag: '6-power' },
  { q: '4의 2제곱 + 3의 2제곱', a: 25, w: 24, tag: '6-power' },
  // 분수 ÷ 분수
  { q: '1/2 ÷ 1/4 = ?',  a: 2,     w: '1/8', tag: '6-frac-div' },
  { q: '3/4 ÷ 1/2 = ?',  a: '3/2', w: '3/8', tag: '6-frac-div' },
  // 소수 곱셈
  { q: '1.2 × 0.5 = ?',  a: 0.6, w: 0.06, tag: '6-dec-mul' },
  { q: '0.4 × 0.5 = ?',  a: 0.2, w: 0.02, tag: '6-dec-mul' },
  // 시간/거리 응용
  { q: '한 시간에 4km, 3시간이면?',  a: '12km', w: '7km',  tag: '6-speed' },
  { q: '15분 + 45분 = ?시간',        a: 1,      w: 2,      tag: '6-time' },
  // 도형 응용
  { q: '내각의 합이 180°인 도형은?', a: '삼각형', w: '사각형', tag: '6-polygon' },
]

// =====================================================================
// 풀 합치기
// =====================================================================
const grade1Pool = dedup([...generateGrade1(), ...grade1Manual])
const grade2Pool = dedup([...generateGrade2(), ...grade2Manual])
const grade3Pool = dedup([
  ...generateGrade3Mul(),
  ...grade3Div,
  ...grade3Add,
  ...grade3Blank,
])
const grade4Pool = dedup([...generateGrade4(), ...grade4Manual])
const grade5Pool = dedup([...generateGrade5(), ...grade5Manual])
const grade6Pool = dedup([...generateGrade6(), ...grade6Manual])

const POOLS = {
  1: grade1Pool,
  2: grade2Pool,
  3: grade3Pool,
  4: grade4Pool,
  5: grade5Pool,
  6: grade6Pool,
}

// 디버그/통계용 — 학년별 개수
export const POOL_SIZES = {
  1: grade1Pool.length,
  2: grade2Pool.length,
  3: grade3Pool.length,
  4: grade4Pool.length,
  5: grade5Pool.length,
  6: grade6Pool.length,
  total: grade1Pool.length + grade2Pool.length + grade3Pool.length
       + grade4Pool.length + grade5Pool.length + grade6Pool.length,
}

// 최근 출제된 문제는 한동안 회피 — 단조로움 방지
const RECENT_AVOID = 6
const recent = []

export function generateProblem(grade /*, stage */) {
  const pool = POOLS[grade] || grade3Pool
  let p
  let tries = 0
  do {
    p = pool[Math.floor(Math.random() * pool.length)]
    tries += 1
  } while (recent.includes(p.q) && tries < 12)
  recent.push(p.q)
  if (recent.length > RECENT_AVOID) recent.shift()
  return {
    question: p.q,
    correct: p.a,
    wrong: p.w,
    tag: p.tag ?? `${grade}-misc`,
  }
}

export function resetProblemHistory() {
  recent.length = 0
}

export const SUPPORTED_GRADES = [1, 2, 3, 4, 5, 6]

// =====================================================================
// 약점 분석용 tag 한글 변환 — GameOver / Clear 화면에서 사용 가능
// =====================================================================
export const TAG_LABELS = {
  // 1학년
  '1-add': '한 자리 덧셈',
  '1-sub': '한 자리 뺄셈',
  '1-blank': '빈칸 채우기',
  // 2학년
  '2-add': '두 자리 덧셈',
  '2-sub': '두 자리 뺄셈',
  '2-mul-2': '구구단 2단',
  '2-mul-3': '구구단 3단',
  '2-mul-4': '구구단 4단',
  '2-mul-5': '구구단 5단',
  '2-blank': '빈칸 채우기',
  '2-time': '시계',
  '2-len': '길이 단위',
  // 3학년
  '3-mul-2': '구구단 2단',
  '3-mul-3': '구구단 3단',
  '3-mul-4': '구구단 4단',
  '3-mul-5': '구구단 5단',
  '3-mul-6': '구구단 6단',
  '3-mul-7': '구구단 7단',
  '3-mul-8': '구구단 8단',
  '3-mul-9': '구구단 9단',
  '3-div': '나눗셈',
  '3-add': '두 자리 덧셈',
  '3-sub': '두 자리 뺄셈',
  '3-blank': '빈칸 채우기',
  // 4학년
  '4-mul': '큰 수 곱셈',
  '4-div': '나눗셈',
  '4-add4': '네 자리 덧셈',
  '4-sub4': '네 자리 뺄셈',
  '4-frac': '분수 기초',
  '4-dec': '소수 기초',
  '4-len': '길이 단위 (km/m)',
  '4-time': '시간 환산',
  '4-angle': '각도',
  '4-blank': '빈칸 채우기',
  // 5학년
  '5-frac-add': '분수 덧셈 (같은 분모)',
  '5-frac-sub': '분수 뺄셈 (같은 분모)',
  '5-frac-add-uneven': '분수 덧셈 (통분)',
  '5-frac-sub-uneven': '분수 뺄셈 (통분)',
  '5-frac-mul': '분수 × 자연수',
  '5-frac-simple': '약분/통분',
  '5-frac-comp': '분수 크기 비교',
  '5-dec-mul': '소수 곱셈',
  '5-dec-div': '소수 나눗셈',
  '5-divisor': '약수',
  '5-gcd': '최대공약수',
  '5-lcm': '최소공배수',
  '5-perimeter': '도형 둘레',
  '5-area': '도형 넓이',
  '5-avg': '평균',
  // 6학년
  '6-ratio': '비례식',
  '6-ratio-real': '비례 응용',
  '6-percent': '백분율',
  '6-pi': '원주율',
  '6-circle': '원의 둘레/넓이',
  '6-volume': '부피',
  '6-power': '거듭제곱',
  '6-frac-div': '분수 나눗셈',
  '6-dec-mul': '소수 곱셈',
  '6-speed': '속력 (거리/시간)',
  '6-time': '시간',
  '6-polygon': '다각형',
}

export function translateTag(tag) {
  return TAG_LABELS[tag] ?? tag
}
