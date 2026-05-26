// Phase 8.8 — 픽셀 아트 스프라이트 로더
// public/assets/sprites/enemies/*.png 를 Three.js Sprite로 변환.
// NearestFilter로 픽셀 블러 방지, alphaTest로 깔끔한 외곽.

import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader()
const cache = new Map()

// 적군 1.0 스케일 = 월드 2.2 단위 (기존 Mesh 1.5 스케일과 비슷한 화면 점유)
export const SPRITE_BASE = 2.2

function applyPixelFilters(tex) {
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace
  else tex.encoding = THREE.sRGBEncoding
  tex.needsUpdate = true
}

// .png 우선 시도, 실패 시 .jpg 폴백 — subdir 별로 캐시
function loadPixelTextureWithFallback(subdir, name, onReady) {
  const key = `${subdir}:${name}`
  if (cache.has(key)) return cache.get(key)

  const pngUrl = `/assets/sprites/${subdir}/${name}.png`
  const jpgUrl = `/assets/sprites/${subdir}/${name}.jpg`

  const tex = textureLoader.load(
    pngUrl,
    (loaded) => {
      applyPixelFilters(loaded)
      onReady?.()
    },
    undefined,
    () => {
      // PNG 없음 → JPG 폴백
      textureLoader.load(
        jpgUrl,
        (loaded) => {
          tex.image = loaded.image
          applyPixelFilters(tex)
          onReady?.()
        },
        undefined,
        (err) => console.warn(`[spriteLoader] 로드 실패: ${subdir}/${name} (png/jpg 모두 없음)`, err),
      )
    },
  )
  applyPixelFilters(tex)
  cache.set(key, tex)
  return tex
}

// 공통 sprite 생성기 (subdir 만 다름)
function buildSprite(subdir, name, scale) {
  const mat = new THREE.SpriteMaterial({
    map: null,
    transparent: true,
    alphaTest: 0.05,
    depthWrite: false,
  })
  const tex = loadPixelTextureWithFallback(subdir, name, () => {
    mat.map = tex
    mat.needsUpdate = true
  })
  mat.map = tex
  const sprite = new THREE.Sprite(mat)
  sprite.frustumCulled = false
  const size = SPRITE_BASE * scale
  sprite.scale.set(size, size, 1)
  sprite.position.y = size / 2
  sprite.userData.restY = size / 2
  sprite.userData.spriteHeight = size
  return sprite
}

/**
 * loadEnemySprite(name, scale)
 * @param {string} name 파일명 (확장자 제외). 예: 'homework-pile'
 * @param {number} scale 1.0 = 월드 2.2 단위 (기본 적 사이즈)
 * @returns {THREE.Sprite}
 */
export function loadEnemySprite(name, scale = 1.0) {
  return buildSprite('enemies', name, scale)
}

/**
 * loadCharacterSprite(name, scale) — public/assets/sprites/characters/${name}.png
 */
export function loadCharacterSprite(name, scale = 1.0) {
  return buildSprite('characters', name, scale)
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
