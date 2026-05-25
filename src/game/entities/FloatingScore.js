import * as THREE from 'three'

// GAME_DESIGN v2.1 §10-3-4 — 처치 시 위로 떠오르는 점수 텍스트

function makeTextTexture(text, color) {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 64
  const ctx = c.getContext('2d')
  ctx.font = 'bold 48px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 6
  ctx.strokeStyle = 'rgba(0,0,0,0.85)'
  ctx.strokeText(text, 64, 34)
  ctx.fillStyle = color
  ctx.fillText(text, 64, 34)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

const LIFE_FRAMES = 50

export class FloatingScorePool {
  constructor(scene) {
    this.scene = scene
    this.items = []
  }

  spawn(position, text, color = '#FFD700', scale = 1) {
    const tex = makeTextTexture(text, color)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
    const sprite = new THREE.Sprite(mat)
    sprite.position.copy(position)
    sprite.position.y += 1.5
    sprite.scale.set(1.4 * scale, 0.7 * scale, 1)
    this.scene.add(sprite)
    this.items.push({ sprite, tex, mat, life: 0 })
  }

  update(envSpeed) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]
      it.life += 1
      it.sprite.position.y += 0.045
      it.sprite.position.z += envSpeed
      it.mat.opacity = Math.max(0, 1 - it.life / LIFE_FRAMES)
      if (it.life >= LIFE_FRAMES) {
        this.scene.remove(it.sprite)
        it.tex.dispose()
        it.mat.dispose()
        this.items.splice(i, 1)
      }
    }
  }
}
