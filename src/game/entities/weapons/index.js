import { createNotebookMesh } from './Notebook.js'
import { createRulerMesh } from './Ruler.js'
import { createPencilMesh } from './Pencil.js'
import { createEraserMesh } from './Eraser.js'
import { createDictionaryMesh } from './Dictionary.js'

// behavior 종류:
//  spin-y           : Y축 회전 + 직선 (Lv1)
//  spin-z-pierce    : Z축 회전 + 관통 (Lv2)
//  straight-trail   : 직선 + 트레일 (Lv3)
//  parabola-aoe     : 포물선 + 광역 폭발 (Lv4)
//  pierce-shockwave : 직선 + 관통 + 충격파 (Lv5)
export const WEAPON_FACTORY = {
  1: { create: createNotebookMesh, behavior: 'spin-y' },
  2: { create: createRulerMesh,    behavior: 'spin-z-pierce' },
  3: { create: createPencilMesh,   behavior: 'straight-trail' },
  4: { create: createEraserMesh,   behavior: 'parabola-aoe' },
  5: { create: createDictionaryMesh, behavior: 'pierce-shockwave' },
}

export function getWeaponFactory(lv) {
  return WEAPON_FACTORY[lv] ?? WEAPON_FACTORY[1]
}
