import { useState } from 'react'
import { CREATURES, TOPS, BOTTOMS, CARDS, FAMILIES, FOODS, BUDGET, DECK_SIZE, suggestedDeck } from '../data/cards.js'
import * as E from '../game/engine.js'

// Ecran dedie : construction du deck (filtres par categorie, cartes possedees seulement).
export default function DeckScreen({ ld, onBack }){
  const { b, setB, owned } = ld
  const [filter,setFilter] = useState('tous')

  const deckCount = Object.values(b.deck).reduce((a,c)=>a+c,0)
  const deckPts = Object.entries(b.deck).reduce((a,[k,v])=>a+v*CARDS[k].pts,0)
  const spent = CREATURES[b.pet].pts + TOPS[b.top].pts + BOTTOMS[b.bottom].pts + deckPts
  const food = Object.entries(b.deck).filter(([k])=>CARDS[k].type==='food').reduce((a,[k,v])=>a+v*(CARDS[k].gain||1),0)
  const fam = CREATURES[b.pet].f
  const ok = spent<=BUDGET && deckCount===DECK_SIZE && food>=8

  const add=(k)=> setB(prev=>{ const n=Object.values(prev.deck).reduce((a,c)=>a+c,0); return n<DECK_SIZE ? ({...prev,deck:{...prev.deck,[k]:(prev.deck[k]||0)+1}}) : prev })
  const sub=(k)=> setB(prev=>{ const d={...prev.deck}; if(d[k]>0){d[k]--; if(!d[k])delete d[k]} return {...prev,deck:d} })
  const setDeck=(deck)=> setB(prev=>({...prev,deck}))

  const sortedCards = Object.entries(CARDS).sort(([,x],[,y])=>{
    const fx = (y.foodType===fam || (y.food&&FOODS[y.food].fam===fam)) - (x.foodType===fam || (x.food&&FOODS[x.food].fam===fam))
    return fx || ((x.cost||0)-(y.cost||0))
  })

  return (
    <div className="screen2" id="build">
      <div className="backbar"><button onClick={onBack}>◀ Retour</button><span className="sp"/><b style={{color:'#fff'}}>🃏 Mon deck</b></div>
      <div className="bhead" style={{background:'#ffd633',borderBottom:'3px solid #111',padding:'6px 10px'}}>
        <div className="bud">
          <div className={spent>BUDGET?'bad':''}>💰 {spent}/{BUDGET}<div className="bar"><i style={{width:Math.min(100,spent/BUDGET*100)+'%',background:spent>BUDGET?'#e53935':'#4caf50'}}/></div></div>
          <div className={deckCount!==DECK_SIZE?'bad':''}>🂠 {deckCount}/{DECK_SIZE}<div className="bar"><i style={{width:(deckCount/DECK_SIZE*100)+'%'}}/></div></div>
          <div className={food<8?'bad':''}>🍖 {food}<div className="bar"><i style={{width:Math.min(100,food/12*100)+'%',background:'#ff9800'}}/></div></div>
        </div>
      </div>
      <div className="bbody">
        <div className="deckbtns">
          <button id="suggestBtn" onClick={()=>setDeck(suggestedDeck(fam, BUDGET - CREATURES[b.pet].pts - TOPS[b.top].pts - BOTTOMS[b.bottom].pts))}>✨ Deck conseille</button>
          <button id="clearBtn" onClick={()=>setDeck({})}>🗑️ Vider</button>
        </div>
        <div className="catfilter">
          {[['tous','Tout'],['familier','🐾 Familier'],['joueur','🧑 Joueur'],['nourriture','🍖 Nourriture']].map(([k,lbl])=>(
            <button key={k} className={filter===k?'on':''} onClick={()=>setFilter(k)}>{lbl}</button>
          ))}
        </div>
        <div id="deck">
          {sortedCards.filter(([k,c])=> owned.has(k) && (filter==='tous' || E.cardCategory(c)===filter)).map(([k,c])=>{
            const favFood=c.food&&FOODS[c.food].fam===fam, favSpell=c.foodType===fam
            return (
              <div key={k} className={'drow'+(favFood||favSpell?' fav':'')+(c.big?' bigc':'')}>
                <span className="e">{c.art}</span>
                <div className="tx">{c.food?FOODS[c.food].art:''}{c.foodType?FAMILIES[c.foodType].i:''}{c.big?'🔥':''} {c.n} · {c.pts}💰{c.cost?' · '+c.cost+'🍖':''}{c.paCost?' · '+c.paCost+'PA':''}<small>{c.txt}</small></div>
                <button onClick={()=>sub(k)}>−</button>
                <span className="ct">{b.deck[k]||0}</span>
                <button onClick={()=>add(k)}>+</button>
              </div>
            )
          })}
        </div>
      </div>
      <div className="s2foot">
        <div className={'deckstatus '+(ok?'ok':'ko')}>{ok?'✓ Deck pret !':(deckCount>DECK_SIZE?`Trop de cartes (${deckCount}/${DECK_SIZE})`:deckCount<DECK_SIZE?`${deckCount}/${DECK_SIZE} cartes`:food<8?`Nourriture ${food}/8`:'Budget depasse')}</div>
        <button className="big" onClick={onBack}>✓ VALIDER</button>
      </div>
    </div>
  )
}
