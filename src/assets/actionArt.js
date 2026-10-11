// Registre des DESSINS D'ACTION deposes dans public/sprites/actions/<cle>.png
// La cle = la cle du SORT (ex: griffe, sumo, tsunami). Rempli par decouper-actions.py.
// Un sort sans dessin depose retombe sur l'animation integree (voir game/actionArt.js).
export const ACTION_ART = {
  // ex: griffe:true, sumo:true
}
export function actionFileUrl(key){ return '/sprites/actions/'+key+'.png' }
export function hasActionFile(key){ return !!ACTION_ART[key] }
