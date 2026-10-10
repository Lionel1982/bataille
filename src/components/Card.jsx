import { FAMILIES, FOODS } from '../data/cards.js'
import * as E from '../game/engine.js'
export default function Card({ card, side, style, disabled, selected, onClick }){
  // card porte _key (attache dans cards.js). costOf a besoin de {key}.
  const spellCost = (side && card._key) ? E.costOf(side,{key:card._key}) : (card.cost||0)
  const cost = card.type==='food' ? '+'+(card.gain||1)+'🍖'
            : card.type==='soda' ? '+1⚡'
            : spellCost+'🍖'
  const bonus = side && card.foodType && card.foodType===side.cr.f
  const badge = card.foodType ? {bg:FAMILIES[card.foodType].c,txt:FAMILIES[card.foodType].i}
    : card.food ? {bg:FAMILIES[FOODS[card.food].fam].c,txt:FOODS[card.food].art} : null
  return (
    <div className={'card t-'+card.type+(card.target==='pote'?' pote':'')+(card.big?' bigc':'')+(bonus?' fav':'')+(disabled?' disabled':'')+(selected?' sel':'')}
         style={style} onClick={onClick}>
      <span className="cost">{cost}</span>
      {badge && <span className="famb" style={{background:badge.bg}}>{badge.txt}</span>}
      <div className="art">{card.art}</div>
      <div className="name">{card.n}</div>
      <div className="txt">{card.txt}</div>
    </div>
  )
}
