import { CARD, costOf, whyNot } from './engine.js'
// Choisit la prochaine action de l'IA. Retourne {card, zone} ou null si plus rien a faire.
export function aiChooseAction(opp){
  // 1) poser une nourriture si possible
  const food = opp.hand.find(c => CARD(c).type==='food' && !whyNot(opp,c))
  if(food) return { card:food, zone:'hand', isFood:true }
  // 2) jouer le sort/soda le plus "cher" jouable (depuis main + poches)
  const pool = [
    ...opp.hand.map(c=>({c,zone:'hand'})),
    ...opp.back.map(c=>({c,zone:'back'})),
    ...opp.front.map(c=>({c,zone:'front'}))
  ].filter(({c}) => CARD(c).type!=='food' && !whyNot(opp,c)
      && !(CARD(c).heal && opp.hp>opp.max-14 && !CARD(c).draw))
  if(pool.length){
    pool.sort((a,b)=> (CARD(b.c).type==='soda')-(CARD(a.c).type==='soda') || costOf(opp,b.c)-costOf(opp,a.c))
    return { card:pool[0].c, zone:pool[0].zone }
  }
  return null
}
// Que mettre en poche en fin de tour (grosses cartes non jouees)
export function aiPocketChoices(opp){
  return opp.hand
    .filter(c=>CARD(c).type==='spell')
    .sort((a,b)=>costOf(opp,b)-costOf(opp,a))
}
