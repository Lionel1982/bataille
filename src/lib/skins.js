// ============================================================
//  SKINS = apparences (4 vues) appartenant a un PERSONNAGE.
//  - Manifeste : public/skins/index.json -> [{ slug, name, views, character }]
//  - Fichiers : public/skins/<slug>/<vue>.png
//  - Chaque personnage (data/characters.js) a un skin par DEFAUT, mais la
//    liaison est REASSIGNABLE a l'execution (surcharge persistee en localStorage).
// ============================================================
import { CHARACTERS } from '../data/characters.js'

const LS='bdp_charskin_v1'   // { <charId>: '<slug>' }  surcharge du skin par defaut

let MANIFEST = { skins: [] }
let LOADED = false

export async function loadManifest(){
  if(LOADED) return MANIFEST
  try{
    const r = await fetch('/skins/index.json', { cache:'no-store' })
    if(r.ok){ const j = await r.json(); MANIFEST = j && Array.isArray(j.skins) ? j : { skins: [] } }
  }catch(e){ MANIFEST = { skins: [] } }
  LOADED = true
  return MANIFEST
}
export function allSkins(){ return MANIFEST.skins || [] }
export function skinBySlug(slug){ return (MANIFEST.skins||[]).find(s=>s.slug===slug) || null }
// Skins compatibles avec un personnage (ceux qui lui appartiennent + ceux sans proprietaire).
export function skinsForCharacter(charId){
  return (MANIFEST.skins||[]).filter(s=> s.character===charId || !s.character)
}

function readOv(){ try{ return JSON.parse(localStorage.getItem(LS)) || {} }catch{ return {} } }
let OVERRIDE = readOv()
function saveOv(){ localStorage.setItem(LS, JSON.stringify(OVERRIDE)) }

// Quel skin (slug) utilise ce personnage ? surcharge > defaut du perso > null
export function skinSlugForCharacter(charId){
  if(OVERRIDE[charId]) return OVERRIDE[charId]
  const c = CHARACTERS[charId]
  return c ? (c.skin||null) : null
}
// Reassigner le skin d'un personnage (null = revenir au defaut).
export function setCharacterSkin(charId, slugOrNull){
  OVERRIDE = { ...OVERRIDE }
  if(slugOrNull) OVERRIDE[charId] = slugOrNull
  else delete OVERRIDE[charId]
  saveOv(); return { ...OVERRIDE }
}
export function getOverrides(){ return { ...OVERRIDE } }

// Portrait d'un personnage : vue 'select' de son skin courant (ou null).
export function charPortrait(charId){ return charViewUrl(charId,'select') }

// URL d'une vue pour un PERSONNAGE (via son skin courant), si la vue existe.
export function charViewUrl(charId, view){
  const slug = skinSlugForCharacter(charId)
  if(!slug) return null
  const sk = skinBySlug(slug)
  if(sk && (sk.views||[]).includes(view)) return '/skins/'+slug+'/'+view+'.png'
  return null
}
