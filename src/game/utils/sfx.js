// 절차적 SFX — Web Audio API 합성. 외부 파일 0, 라이선스 X.

let ctx = null
let master = null

function ensureCtx() {
  if (ctx) return ctx
  const C = window.AudioContext || window.webkitAudioContext
  if (!C) return null
  ctx = new C()
  master = ctx.createGain()
  master.gain.value = 0.7
  master.connect(ctx.destination)
  return ctx
}

export function resumeSfxCtx() {
  const c = ensureCtx()
  if (c && c.state === 'suspended') c.resume()
}

export function setSfxMasterVolume(v) {
  ensureCtx()
  if (master) master.gain.value = v
}

// === 빌딩 블록 ===

function envelope(gain, attack, hold, release, now, peak) {
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(peak, now + attack)
  gain.gain.setValueAtTime(peak, now + attack + hold)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + hold + release)
}

function tone({ freq, type = 'sine', dur, peak = 0.25, freqEnd, delay = 0 }) {
  const c = ensureCtx()
  if (!c) return
  const start = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  if (freqEnd != null && freqEnd > 0) {
    o.frequency.exponentialRampToValueAtTime(freqEnd, start + dur)
  }
  o.connect(g).connect(master)
  envelope(g, 0.005, 0.02, dur, start, peak)
  o.start(start)
  o.stop(start + dur + 0.08)
}

function noiseBurst({ dur, peak = 0.25, lowpass = 2000, highpass = 0, delay = 0 }) {
  const c = ensureCtx()
  if (!c) return
  const start = c.currentTime + delay
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  let node = src
  if (highpass > 0) {
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = highpass
    node.connect(hp); node = hp
  }
  if (lowpass > 0) {
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = lowpass
    node.connect(lp); node = lp
  }
  const g = c.createGain()
  node.connect(g).connect(master)
  envelope(g, 0.001, 0.01, dur, start, peak)
  src.start(start)
  src.stop(start + dur + 0.05)
}

// === SFX 정의 ===

const PLAYERS = {
  shoot() {
    // 짧은 위쉬 + 하강 핀치
    noiseBurst({ dur: 0.07, peak: 0.18, lowpass: 5000, highpass: 800 })
    tone({ freq: 900, freqEnd: 350, type: 'square', dur: 0.06, peak: 0.08 })
  },
  correct() {
    // 띵-동 (G6 → C7)
    tone({ freq: 1568, type: 'sine', dur: 0.12, peak: 0.28 })
    tone({ freq: 2093, type: 'sine', dur: 0.22, peak: 0.28, delay: 0.09 })
    // 살짝 별이 반짝이는 느낌의 하모닉
    tone({ freq: 3136, type: 'triangle', dur: 0.18, peak: 0.08, delay: 0.09 })
  },
  wrong() {
    // 무겁지 않은 부저음 — 살짝 디튠된 두 사각파
    tone({ freq: 220, type: 'square', dur: 0.25, peak: 0.18, freqEnd: 140 })
    tone({ freq: 233, type: 'square', dur: 0.25, peak: 0.12, freqEnd: 148, delay: 0.005 })
  },
  kill() {
    // 만화적 "퐁!"
    noiseBurst({ dur: 0.09, peak: 0.25, lowpass: 1800, highpass: 200 })
    tone({ freq: 320, freqEnd: 90, type: 'triangle', dur: 0.13, peak: 0.18 })
  },
  recruit() {
    // 상승 아르페지오 C5-E5-G5 (도-미-솔)
    tone({ freq: 523, type: 'sine', dur: 0.09, peak: 0.22 })
    tone({ freq: 659, type: 'sine', dur: 0.09, peak: 0.22, delay: 0.08 })
    tone({ freq: 784, type: 'sine', dur: 0.18, peak: 0.24, delay: 0.16 })
  },
  bossDie() {
    // 화려한 승리 팡파레: 화음 + 화이트 노이즈 폭발
    noiseBurst({ dur: 0.25, peak: 0.18, lowpass: 6000 })
    // C major chord (C5, E5, G5) 길게
    tone({ freq: 523, type: 'sawtooth', dur: 0.6, peak: 0.18 })
    tone({ freq: 659, type: 'sawtooth', dur: 0.6, peak: 0.16, delay: 0.04 })
    tone({ freq: 784, type: 'sawtooth', dur: 0.6, peak: 0.16, delay: 0.08 })
    // 위로 솟아오르는 sine
    tone({ freq: 880,  freqEnd: 1760, type: 'sine', dur: 0.9, peak: 0.18, delay: 0.2 })
    tone({ freq: 1318, type: 'sine', dur: 0.4, peak: 0.16, delay: 0.6 })
  },
  combo() {
    // 콤보 마일스톤 — 밝은 상승 핑
    tone({ freq: 1200, freqEnd: 1800, type: 'sine', dur: 0.12, peak: 0.22 })
    tone({ freq: 2400, type: 'triangle', dur: 0.08, peak: 0.08, delay: 0.06 })
  },
  fever() {
    // 피버 돌입 — 상승 스윕 + 아르페지오
    noiseBurst({ dur: 0.3, peak: 0.1, lowpass: 4000, highpass: 400 })
    tone({ freq: 440, freqEnd: 1760, type: 'sawtooth', dur: 0.45, peak: 0.16 })
    tone({ freq: 523, type: 'sine', dur: 0.1, peak: 0.2, delay: 0.1 })
    tone({ freq: 659, type: 'sine', dur: 0.1, peak: 0.2, delay: 0.2 })
    tone({ freq: 784, type: 'sine', dur: 0.1, peak: 0.2, delay: 0.3 })
    tone({ freq: 1047, type: 'sine', dur: 0.3, peak: 0.24, delay: 0.4 })
  },
  count() {
    // 카운트다운 비프
    tone({ freq: 800, type: 'square', dur: 0.1, peak: 0.15 })
  },
  go() {
    // 출발! — 상승 화음
    tone({ freq: 1047, type: 'square', dur: 0.25, peak: 0.2 })
    tone({ freq: 1319, type: 'square', dur: 0.25, peak: 0.15, delay: 0.02 })
    tone({ freq: 1568, type: 'sine', dur: 0.35, peak: 0.2, delay: 0.05 })
  },
  bossWarn() {
    // 보스 경고 사이렌 — 낮은 톱니 2회
    tone({ freq: 180, freqEnd: 420, type: 'sawtooth', dur: 0.35, peak: 0.2 })
    tone({ freq: 180, freqEnd: 420, type: 'sawtooth', dur: 0.35, peak: 0.2, delay: 0.45 })
    noiseBurst({ dur: 0.15, peak: 0.08, lowpass: 800, delay: 0.05 })
  },
  tick() {
    // 시간 임박 틱
    tone({ freq: 1000, type: 'square', dur: 0.04, peak: 0.12 })
  },
}

export function playSfxProc(name) {
  const fn = PLAYERS[name]
  if (!fn) return
  ensureCtx()
  resumeSfxCtx()
  fn()
}
