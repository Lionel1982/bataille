// ============================================================
//  SORTS "PLANESWALKER" DU FAMILIER (etape 2).
//  3 sorts par familier : ① Confiance, ② Agressivite, ③ Special.
//  Modele : SEUIL + CONSOMMATION. Un sort est activable quand la ressource
//  atteint le seuil ; le lancer CONSOMME la ressource.
//  res : 'conf' | 'aggro' | 'mix' | 'hp'  (ressource necessaire)
//  cost : montant consomme (conf en points, aggro en crans, hp en PV du familier)
//  need : seuil minimal pour activer
//  Effets (appliques par engine.applyPetSpell) :
//    heal:N (soigne le familier), dmg:N (degats au familier adverse),
//    healPhp:N (soigne le perso), dodgeBoost:1 (double l'esquive ce tour)
// ============================================================

// Les deux PREMIERS sorts sont COMMUNS a tous les familiers.
const COMMON = [
  { id:'conf',  icon:'💙', res:'conf',  need:40, cost:40, name:'Cri de confiance',
    dmg:0, heal:20, txt:'Confiance ≥ 40. Consomme 40 de confiance et soigne le familier de 20 PV.' },
  { id:'aggro', icon:'😡', res:'aggro', need:3,  cost:3,  name:'Defoulement',
    dmg:20, heal:0, txt:'Agressivite ≥ 3 crans. Consomme 3 crans et inflige ~20 degats au familier adverse.' },
]

// Le TROISIEME sort est SPECIAL, propre a chaque familier (les autres heritent d'un special generique neutre).
const SPECIAL = {
  chien:    { id:'special', icon:'🐶', res:'mix', need:0, costConf:30, costAggro:2, name:'Fidelite',
              dmg:15, healPhp:10, txt:'Confiance ≥ 30 ET agressivite ≥ 2. Consomme les deux : inflige ~15 degats ET soigne ton perso de 10 PV (le chien te protege).' },
  elephant: { id:'special', icon:'🐘', res:'hp', need:10, cost:10, name:'Charge massive',
              dmg:30, txt:'Sacrifie 10 PV du familier pour infliger ~30 degats au familier adverse.' },
  chat:     { id:'special', icon:'🐱', res:'conf', need:50, cost:50, name:'Caprice',
              dodgeBoost:1, txt:'Confiance ≥ 50. Consomme 50 de confiance : le chat devient insaisissable (esquive doublee ce tour).' },
}

const SPECIAL_DEFAULT = { id:'special', icon:'✨', res:'conf', need:60, cost:60, name:'Instinct',
  heal:15, dmg:10, txt:'(generique) Confiance ≥ 60. Consomme 60 : soigne 15 PV et inflige ~10 degats.' }

// Retourne les 3 sorts d'un familier (par cle de creature).
export function petSpells(petKey){
  const special = SPECIAL[petKey] || SPECIAL_DEFAULT
  return [ COMMON[0], COMMON[1], special ]
}

// La ressource est-elle suffisante pour activer ce sort ?
export function spellReady(side, sp){
  if(sp.res==='conf')  return (side.conf||0)  >= sp.need
  if(sp.res==='aggro') return (side.aggro||0) >= sp.need
  if(sp.res==='hp')    return (side.hp||0)    >  sp.cost   // il faut survivre au sacrifice
  if(sp.res==='mix')   return (side.conf||0) >= 30 && (side.aggro||0) >= 2
  return false
}

// Libelle court du cout (pour la box de sort).
export function spellCostLabel(sp){
  if(sp.res==='conf')  return sp.cost+' 💙'
  if(sp.res==='aggro') return sp.cost+' 😡'
  if(sp.res==='hp')    return sp.cost+' ❤️'
  if(sp.res==='mix')   return '30💙 + 2😡'
  return ''
}
