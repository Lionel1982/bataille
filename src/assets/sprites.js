// ============================================================
//  Resolution des sprites multi-vues (front/back/defeated/select).
//  Fichier attendu : public/sprites/<kind>/<key>-<view>.png (PNG transparent).
//  Avatars : la cle est un ID DE PERSONNAGE -> on passe par son skin courant.
//  Repli : image integree (IMG) pour la vue par defaut, sinon placeholder.
// ============================================================
import { IMG } from './images.js'
import { hasView } from './customSprites.js'
import { charViewUrl } from '../lib/skins.js'

export const PLACEHOLDER = '/sprites/placeholder.svg'

export function viewUrl(kind, key, view){ return '/sprites/'+kind+'/'+key+'-'+view+'.png' }

export function builtin(kind, key){
  if(kind==='familiers') return IMG.anim?.[key]
  if(kind==='avatars')   return IMG.avatarFull?.[key] || IMG.avatarKnee?.[key]
  if(kind==='actions')   return IMG.act?.[key]
  return null
}

// (kind,key,view) :
//  - avatars : skin courant du PERSONNAGE (key = charId) -> fichier public du skin
//  - sinon vue custom deposee (familiers) -> fichier public
//  - sinon image integree pour front/back/select -> IMG
//  - sinon placeholder
export function spriteFor(kind, key, view){
  if(kind==='avatars'){
    const su = charViewUrl(key, view)                 // via le skin du personnage
    if(su) return { src:su, fallback:builtin(kind,key)||PLACEHOLDER }
  }
  if(hasView(kind,key,view)) return { src:viewUrl(kind,key,view), fallback:builtin(kind,key)||PLACEHOLDER }
  const bi = builtin(kind,key)
  if(bi && (view==='front'||view==='back'||view==='select')) return { src:bi, fallback:PLACEHOLDER }
  return { src: PLACEHOLDER, fallback: PLACEHOLDER }
}
export function onSpriteError(fallbackUri){
  return (e)=>{ const img=e.currentTarget; if(fallbackUri && img.getAttribute('src')!==fallbackUri){ img.src=fallbackUri } }
}
