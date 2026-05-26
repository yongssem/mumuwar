// Phase 8.8 — 픽셀 아트 스프라이트 로더
// public/assets/sprites/enemies/*.png 를 Three.js Sprite로 변환.
// NearestFilter로 픽셀 블러 방지, alphaTest로 깔끔한 외곽.

import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader()
const cache = new Map()

// 적군 1.0 스케일 = 월드 2.2 단위 (기존 Mesh 1.5 스케일과 비슷한 화면 점유)
export const SPRITE_BASE = 2.2

function loadPixelTexture(url) {
  if (cache.has(url)) return cache.get(url)
  const tex = textureLoader.load(
    url,
    undefined,
    undefined,
    (err) => console.warn(`[spriteLoader] 로드 실패: ${url}`, err),
  )
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace
  else tex.encoding = THREE.sRGBEncoding
  cache.set(url, tex)
  return tex
}

/**
 * loadEnemySprite(name, scale)
 * @param {string} name 파일명 (확장자 제외). 예: 'homework-pile'
 * @param {number} scale 1.0 = 월드 2.2 단위 (기본 적 사이즈)
 * @returns {THREE.Sprite}
 */
export function loadEnemySprite(name, scale = 1.0) {
  const url = `/assets/sprites/enemies/${name}.png`
  const tex = loadPixelTexture(url)
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.5,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(mat)
  const size = SPRITE_BASE * scale
  sprite.scale.set(size, size, 1)
  // bottom anchor: 스프라이트가 바닥에 서있도록 y = height/2
  sprite.position.y = size / 2
  // 메타 보관 — Enemy 측에서 흔들림 기준 height로 사용
  sprite.userData.restY = size / 2
  sprite.userData.spriteHeight = size
  return sprite
}

/**
 * 발 밑에 깔리는 둥근 그림자 메쉬.
 * @param {number} radius
 */
export function makeGroundShadow(radius = 0.6) {
  const geo = new THREE.CircleGeometry(radius, 16)
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  })
  const m = new THREE.Mesh(geo, mat)
  m.rotation.x = -Math.PI / 2
  m.position.y = 0.02
  return m
}
