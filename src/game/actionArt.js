import { IMG } from '../assets/images.js'
// Quelle illustration d'action montrer pour un sort donne (cle de CARDS -> cle de IMG.act)
const MAP = {
  morsure:'morsure', griffe:'morsure', sumo:'morsure', charge:'morsure',
  pue:'pue', nuclear:'nuclear', venin:'pue',
  bave:'bave', tsunami:'bave', fiente:'bave', sable:'bave',
  grimace:'grimace', pique:'grimace',
  vabosser:'vabosser',
  poche:'poche',
  calin:'calin', apero:'calin', mue:'calin', bulle:'calin'
}
export function actionArt(cardKey){
  const k = MAP[cardKey]
  return k ? IMG.act[k] : null
}
