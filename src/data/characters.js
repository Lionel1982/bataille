// ============================================================
//  Registre des PERSONNAGES (identite + skin par defaut + stats a venir).
//  Un personnage N'EST PAS un skin : c'est une entite de gameplay propre.
//  - skin : slug du skin par defaut (apparence 4 vues, defini dans public/skins/index.json)
//  - stats : EMPLACEMENT PRET pour demain (hp, force, vitesse...). Vide pour l'instant.
//  La liaison perso -> skin est REASSIGNABLE a l'execution (voir lib/skins.js, surcharge localStorage).
// ============================================================
export const CHARACTERS = {
  akhenat: { n:'Akhenat', skin:'Akhenat', stats:{} },
  alex:    { n:'Alex El-Rien', skin:'alex', stats:{} },
}

// Personnages generiques de REPLI (pas de planche encore : images integrees/emoji).
// Ils restent jouables tant que tu n'as pas fait leurs 4 vues.
export const FALLBACK_AVATARS = {
  h1:{n:'Max',g:'h'}, h2:{n:'Theo',g:'h'}, h3:{n:'Hugo',g:'h'},
  f1:{n:'Lea',g:'f'}, f2:{n:'Zoe',g:'f'}, f3:{n:'Jade',g:'f'}
}

export function characterList(){ return Object.entries(CHARACTERS).map(([id,c])=>({ id, ...c })) }
export function getCharacter(id){ return CHARACTERS[id] || null }
