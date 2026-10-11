// Registre des sprites PERSONNALISES deposes dans public/sprites/.
// Pour CHAQUE entite, liste les VUES disponibles que tu as deposees.
// Vues possibles : 'front' (face), 'back' (dos), 'defeated' (KO couche), 'select' (portrait).
// Exemple apres avoir depose public/sprites/familiers/chien-front.png et chien-back.png :
//   familiers: { chien: ['front','back'] }
// Les vues NON listees utilisent un placeholder (ou l'image integree pour la vue par defaut).
export const CUSTOM = {
  familiers: {},   // ex: { chien:['front','back','defeated','select'], chat:['front'] }
  avatars: {}      // ex: { h1:['front','back','defeated','select'] }
}
export function viewsOf(kind, key){ return (CUSTOM[kind] && CUSTOM[kind][key]) || [] }
export function hasView(kind, key, view){ return viewsOf(kind,key).includes(view) }
export function hasCustom(kind, key){ return viewsOf(kind,key).length>0 }
