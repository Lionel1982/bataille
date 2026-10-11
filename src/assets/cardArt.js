// Registre des DESSINS de cartes deposes dans public/sprites/cartes/<cle>.png
// Ajoute la cle ici une fois le fichier depose (le script de decoupe le fait tout seul).
// Les cartes sans dessin gardent leur emoji (repli).
export const CARD_ART = {
  // ex: croq:true, papouilles:true  (rempli automatiquement par le script de decoupe)
}
export function cardArtUrl(key){ return '/sprites/cartes/'+key+'.png' }
export function hasCardArt(key){ return !!CARD_ART[key] }
