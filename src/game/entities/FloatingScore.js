import * as THREE from 'three'

// Phase 8.5 §5 — 떠오르는 점수 텍스트 (글로우 + 메가 변종)

function makeTextTexture(text, color, isMega = false) {
  const c = document.createElement('canvas')
  c.width = isMega ? 512 : 192
  c.height = isMega ? 192 : 96
  const ctx = c.getContext('2d')
  const fontSize = isMega ? 130 : 56
  ctx.font = `900 ${fontSize}px "Pretendard", "Cinzel", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // 글로우 (그림자 블러)
  ctx.shadowColor = color
  ctx.shadowBlur = isMega ? 30 : 14
  // 외곽선
  ctx.lineWidth = isMega ? 10 : 6
  ctx.strokeStyle = '#000000'
  ctx.lineJoin = 'round'
  ctx.strokeText(text, c.width / 2, c.height / 2)
  // 본문
  ctx.fillStyle = color
  ctx.fillText(text, c.width / 2, c.height / 2)
  ctx.shadowBlur = 0
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

const LIFE_FRAMES = 55
const MEGA_LIFE = 70

export class FloatingScorePool {
  constructor(scene) {
    this.scene = scene
    this.items = []
  }

  spawn(position, text, color = '#FFD700', scale = 1) {
    const tex = makeTextTexture(text, color, false)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
    const sprite = new THREE.Sprite(mat)
    sprite.position.copy(position)
    sprite.position.y += 1.5
    sprite.scale.set(1.8 * scale, 0.9 * scale, 1)
    this.scene.add(sprite)
    this.items.push({ sprite, tex, mat, life: 0, maxLife: LIFE_FRAMES, mega: false, vy: 0.055 })
    // 동시 50개 캡
    while (this.items.length > 50) {
      const old = this.items.shift()
      this.scene.remove(old.sprite)
      old.tex.dispose()
      old.mat.dispose()
    }
  }

  // 화면 가운데 메가 텍스트 (큰 보상 시) — 카메라 정면 좌표 사용
  spawnMega(position, text, color = '#FFD600') {
    const tex = makeTextTexture(text, color, true)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
    const sprite = new THREE.Sprite(mat)
    sprite.position.copy(position)
    sprite.position.y += 3.5
    sprite.scale.set(5, 2.5, 1)
    this.scene.add(sprite)
    this.items.push({ sprite, tex, mat, life: 0, maxLife: MEGA_LIFE, mega: true, vy: 0.025 })
  }

  // 다발 — 게이트 정답 통과 시 +1 텍스트 여러 개 순차 (캡 30)
  spawnBurst(position, text, color, count) {
    const capped = Math.min(count, 30)
    for (let i = 0; i < capped; i++) {
      const delay = i * 50
      setTimeout(() => {
        const p = position.clone()
        p.x += (Math.random() - 0.5) * 2.2
        p.y += Math.random() * 0.6
        p.z += (Math.random() - 0.5) * 0.6
        this.spawn(p, text, color, 0.7)
      }, delay)
    }
  }

  update(envSpeed) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]
      it.life += 1
      it.sprite.position.y += it.vy
      it.sprite.position.z += envSpeed
      const t = it.life / it.maxLife
      // 메가는 펄스 (튀어오르고 줄어듦)
      if (it.mega) {
        let pulse = 1
        if (t < 0.2) pulse = 0.6 + (t / 0.2) * 0.7      // 0.6 → 1.3
        else if (t < 0.5) pulse = 1.3 - ((t - 0.2) / 0.3) * 0.3 // 1.3 → 1.0
        else pulse = 1.0 + (t - 0.5) * 0.4              // 1.0 → 1.2
        it.sprite.scale.set(5 * pulse, 2.5 * pulse, 1)
        it.mat.opacity = t < 0.15 ? t / 0.15 : Math.max(0, 1 - (t - 0.15) / 0.85)
      } else {
        it.mat.opacity = Math.max(0, 1 - t)
      }
      if (it.life >= it.maxLife) {
        this.scene.remove(it.sprite)
        it.tex.dispose()
        it.mat.dispose()
        this.items.splice(i, 1)
      }
    }
  }
}
