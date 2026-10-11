// ============================================================
//  Resolution des sprites : fichier depose dans public/sprites/ (prioritaire)
//  avec repli automatique sur l'image integree (IMG, base64).
//  Usage : <img src={spriteSrc('familiers', key)} onError={spriteFallback(fallbackDataUri)} />
// ============================================================
import { IMG } from './images.js'

// URL publique d'un sprite depose par l'utilisateur (sert si le fichier existe).
export function publicSprite(kind, key){ return '/sprites/'+kind+'/'+key+'.png' }

// Image integree correspondante (repli).
export function builtin(kind, key){
  if(kind==='familiers') return IMG.anim?.[key]
  if(kind==='avatars')   return IMG.avatarKnee?.[key] || IMG.avatarFull?.[key]
  if(kind==='actions')   return IMG.act?.[key]
  return null
}

// Handler onError : bascule sur l'image integree si le fichier public manque.
export function onSpriteError(fallbackUri){
  return (e)=>{ const img=e.currentTarget; if(fallbackUri && img.src.indexOf('data:')!==0){ img.src=fallbackUri } else { img.style.visibility='hidden' } }
}
