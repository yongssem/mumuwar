import { Howl, Howler } from 'howler'
import { playSfxProc, setSfxMasterVolume, resumeSfxCtx } from './sfx.js'

const BASE = '/assets/sounds/'

// BGM은 Howler (mp3 파일), SFX는 절차적 합성 (sfx.js)
const opts = (src, extra = {}) => ({
  src: [BASE + src],
  preload: true,
  onloaderror: () => { /* 파일 없으면 무음, 게임은 계속 */ },
  ...extra,
})

const bgms = {
  menu:   new Howl(opts('bgm-menu.mp3',   { loop: true, volume: 0.35 })),
  main:   new Howl(opts('bgm-main.mp3',   { loop: true, volume: 0.40 })),
  boss:   new Howl(opts('bgm-boss.mp3',   { loop: true, volume: 0.45 })),
  ending: new Howl(opts('bgm-ending.mp3', { loop: false, volume: 0.50 })),
}

let currentBgmKey = null
let muted = false

export function playBgm(key) {
  if (currentBgmKey === key) return
  if (currentBgmKey && bgms[currentBgmKey]) bgms[currentBgmKey].stop()
  currentBgmKey = key
  if (muted) return
  const b = bgms[key]
  if (b && !b.playing()) b.play()
  // 사용자 인터랙션 이후 호출되므로 SFX AudioContext도 깨워둠
  resumeSfxCtx()
}

export function stopBgm() {
  if (currentBgmKey && bgms[currentBgmKey]) bgms[currentBgmKey].stop()
  currentBgmKey = null
}

// 발사 SFX throttle
let lastShootAt = 0

export function playSfx(key) {
  if (muted) return
  if (key === 'shoot') {
    const now = performance.now()
    if (now - lastShootAt < 70) return
    lastShootAt = now
  }
  playSfxProc(key)
}

export function setMuted(m) {
  muted = !!m
  Howler.mute(muted)
  setSfxMasterVolume(muted ? 0 : 0.7)
  if (!muted && currentBgmKey) {
    const b = bgms[currentBgmKey]
    if (b && !b.playing()) b.play()
  }
}

export function isMuted() { return muted }
