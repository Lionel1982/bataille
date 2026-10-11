import { IMG } from '../assets/images.js'
import { hasActionFile, actionFileUrl } from '../assets/actionArt.js'

// Mapping de repli : quel dessin INTEGRE montrer pour un sort (cle CARDS -> cle IMG.act).
const MAP = {
  morsure:'morsure', griffe:'morsure', sumo:'morsure', charge:'morsure',
  pue:'pue', nuclear:'nuclear', venin:'pue',
  bave:'bave', tsunami:'bave', fiente:'bave', sable:'bave',
  grimace:'grimace', pique:'grimace',
  vabosser:'vabosser',
  poche:'poche',
  calin:'calin', apero:'calin', mue:'calin', bulle:'calin'
}

// Renvoie l'URI du dessin d'action pour un sort :
//  1) si TU as depose public/sprites/actions/<cle-du-sort>.png -> ce fichier (dessin propre au sort)
//  2) sinon, l'animation integree partagee (via MAP)
//  3) sinon null (pas de dessin d'action)
export function actionArt(cardKey){
  if(hasActionFile(cardKey)) return actionFileUrl(cardKey)
  const k = MAP[cardKey]
  return k ? IMG.act[k] : null
}
