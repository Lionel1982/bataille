import { FAMILIES, FOODS } from '../data/cards.js'
import * as E from '../game/engine.js'
export default function Card({ card, side, style, disabled, selected, onClick }){
  const cost = card.type==='food' ? '+'+(card.gain||1)+'🍖' : card.type==='soda' ? '+1⚡' : (side?E.costOf(side,{key:keyOf(card)}):card.cost)+'🍖'
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
// retrouve la cle d'une carte a partir de son objet (pour costOf) — fallback simple
function keyOf(card){ return card._key || Object.keys(card).length?card.__key:undefined }
