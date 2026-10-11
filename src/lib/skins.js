// ============================================================
//  Systeme de SKINS nommes librement + assignation par emplacement.
//  - Les skins sont decrits dans public/skins/index.json (manifeste).
//  - Fichiers : public/skins/<slug>/<vue>.png  (vues: front/back/defeated/select)
//  - L'utilisateur assigne un skin a un emplacement d'avatar (h1..f3)
//    ou le definit comme DEFAUT GLOBAL. Assignations persistees en localStorage.
//  - Rien n'est ecrase : les images integrees restent le repli.
// ============================================================
const LS='bdp_skins_v1'   // { byAvatar:{h1:'slug',...}, def:'slug'|null }

let MANIFEST = { skins: [] }   // { slug, name, views:['front',...] }[]
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

function readAssign(){ try{ return JSON.parse(localStorage.getItem(LS)) || {byAvatar:{},def:null} }catch{ return {byAvatar:{},def:null} } }
let ASSIGN = readAssign()
function saveAssign(){ localStorage.setItem(LS, JSON.stringify(ASSIGN)) }

export function getAssignments(){ return { byAvatar:{...ASSIGN.byAvatar}, def:ASSIGN.def } }
export function assignToAvatar(avatarKey, slugOrNull){
  ASSIGN = { ...ASSIGN, byAvatar: { ...ASSIGN.byAvatar } }
  if(slugOrNull) ASSIGN.byAvatar[avatarKey] = slugOrNull
  else delete ASSIGN.byAvatar[avatarKey]
  saveAssign(); return getAssignments()
}
export function setDefaultSkin(slugOrNull){ ASSIGN = { ...ASSIGN, def: slugOrNull||null }; saveAssign(); return getAssignments() }

// Quel skin s'applique a cet emplacement d'avatar ? (precis > defaut global > aucun)
export function skinForAvatar(avatarKey){
  const slug = (ASSIGN.byAvatar && ASSIGN.byAvatar[avatarKey]) || ASSIGN.def || null
  return slug ? skinBySlug(slug) : null
}
// URL d'une vue de skin si le skin la possede, sinon null.
export function skinViewUrl(avatarKey, view){
  const sk = skinForAvatar(avatarKey)
  if(sk && (sk.views||[]).includes(view)) return '/skins/'+sk.slug+'/'+view+'.png'
  return null
}
