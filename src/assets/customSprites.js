// Registre des sprites PERSONNALISES deposes dans public/sprites/.
// Ajoute ici la cle d'un sprite une fois que tu as depose le fichier correspondant,
// pour que le jeu utilise TON image au lieu de celle integree.
// Exemple : familiers: ['chien','chat']  -> utilisera public/sprites/familiers/chien.png etc.
export const CUSTOM = {
  familiers: [],   // ex: ['chien','chat','elephant']
  actions: [],     // ex: ['morsure']
  avatars: []      // ex: ['h1','f2']
}
export function hasCustom(kind, key){ return (CUSTOM[kind]||[]).includes(key) }
