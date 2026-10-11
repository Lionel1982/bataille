import { FAMILIES, FOODS } from '../data/cards.js'
import * as E from '../game/engine.js'
import { cardArtUrl, hasCardArt } from '../assets/cardArt.js'

export default function Card({ card, side, style, disabled, selected, onClick, onPointerDown }){
  // COUT de la carte (ressource NECESSAIRE pour la jouer) :
  //  - PA : nombre de carres jaunes (paCostOf). Les attaques du familier (target pet) = 0 PA.
  //  - Nourriture : seulement si c'est un sort qui CONSOMME de la nourriture (cost>0).
  const paCost = E.paCostOf(card._key ? {key:card._key} : card)
  const foodCost = (card.type==='spell' && (card.cost||0)>0 && side && card._key) ? E.costOf(side,{key:card._key})
                 : (card.type==='spell' && (card.cost||0)>0) ? (card.cost||0) : 0
  const bonus = side && card.foodType && card.foodType===side.cr.f
  const badge = card.foodType ? {bg:FAMILIES[card.foodType].c,txt:FAMILIES[card.foodType].i}
    : card.food ? {bg:FAMILIES[FOODS[card.food].fam].c,txt:FOODS[card.food].art} : null
  const hasImg = card._key && hasCardArt(card._key)
  return (
    <div className={'card t-'+card.type+(card.target==='pote'?' pote':'')+(card.big?' bigc':'')+(bonus?' fav':'')+(disabled?' disabled':'')+(selected?' sel':'')}
         style={style} onClick={onClick} onPointerDown={onPointerDown}>
      {/* Haut : nom a gauche, cout a droite */}
      <div className="chead">
        <span className="cname">{card.n}</span>
        <span className="ccost">
          {Array.from({length:paCost}).map((_,k)=><i key={k} className="pacube"/>)}
          {foodCost>0 && <span className="foodcost">{foodCost}🍖</span>}
          {paCost===0 && foodCost===0 && <span className="freecost">0</span>}
        </span>
      </div>
      {badge && <span className="famb" style={{background:badge.bg}}>{badge.txt}</span>}
      {/* Grand dessin : image si dispo, sinon emoji */}
      <div className="cart">
        {hasImg ? <img src={cardArtUrl(card._key)} alt={card.n} className="cartimg"/> : <span className="cartemo">{card.art}</span>}
      </div>
      {/* Effet : texte noir sur bandeau blanc */}
      <div className="ctxt">{card.txt}</div>
    </div>
  )
}
