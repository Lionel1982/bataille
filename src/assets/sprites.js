// ============================================================
//  Resolution des sprites multi-vues (front/back/defeated/select).
//  Fichier attendu : public/sprites/<kind>/<key>-<view>.png (PNG transparent).
//  Repli : image integree (IMG) pour la vue par defaut, sinon placeholder.
// ============================================================
import { IMG } from './images.js'
import { hasView } from './customSprites.js'
import { skinViewUrl } from '../lib/skins.js'

export const PLACEHOLDER = '/sprites/placeholder.svg'

// URL publique d'une vue precise.
export function viewUrl(kind, key, view){ return '/sprites/'+kind+'/'+key+'-'+view+'.png' }

// Image integree de repli (une seule vue dispo historiquement).
export function builtin(kind, key){
  if(kind==='familiers') return IMG.anim?.[key]
  if(kind==='avatars')   return IMG.avatarFull?.[key] || IMG.avatarKnee?.[key]
  if(kind==='actions')   return IMG.act?.[key]
  return null
}

// Source a utiliser pour (kind,key,view) :
//  - si une vue custom existe -> le fichier public
//  - sinon, pour 'front'/'back' d'un familier/avatar on retombe sur l'image integree
//  - sinon -> placeholder
export function spriteFor(kind, key, view){
  // Priorite absolue : un SKIN assigne a cet emplacement d'avatar.
  if(kind==='avatars'){
    const su = skinViewUrl(key, view)
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
