import { useState, useEffect } from 'react'
import { CREATURES, TOPS, BOTTOMS, AVATARS, CARDS, FAMILIES, FOODS, TRAITS, BUDGET, DECK_SIZE, suggestedDeck } from '../data/cards.js'
import { IMG } from '../assets/images.js'
import { supabase, online } from '../lib/supabase.js'

const LS='bdp_build_v5'
const load=()=>{ try{return JSON.parse(localStorage.getItem(LS))||null}catch{return null} }

export default function Build({ auth, onFight, onOnline }){
  const [b,setB] = useState(()=> load() || { avatar:'h1', pet:'chien', top:'tshirt', bottom:'jean', deck:{} })
  useEffect(()=>{ localStorage.setItem(LS, JSON.stringify(b)) },[b])

  const deckCount = Object.values(b.deck).reduce((a,c)=>a+c,0)
  const deckPts = Object.entries(b.deck).reduce((a,[k,v])=>a+v*CARDS[k].pts,0)
  const spent = CREATURES[b.pet].pts + TOPS[b.top].pts + BOTTOMS[b.bottom].pts + deckPts
  const food = Object.entries(b.deck).filter(([k])=>CARDS[k].type==='food').reduce((a,[k,v])=>a+v*(CARDS[k].gain||1),0)
  const fam = CREATURES[b.pet].f
  const ok = spent<=BUDGET && deckCount===DECK_SIZE && food>=8

  const set=(patch)=> setB(prev=>({...prev,...patch}))
  const add=(k)=> setB(prev=>{ const n=Object.values(prev.deck).reduce((a,c)=>a+c,0); return n<DECK_SIZE ? ({...prev,deck:{...prev.deck,[k]:(prev.deck[k]||0)+1}}) : prev })
  const sub=(k)=> setB(prev=>{ const d={...prev.deck}; if(d[k]>0){d[k]--; if(!d[k])delete d[k]} return {...prev,deck:d} })

  async function fight(){
    if(online && auth.session){
      await supabase.from('decks').upsert({ owner:auth.session.user.id, name:'Mon deck', pet:b.pet, top:b.top, bottom:b.bottom, cards:b.deck, updated_at:new Date().toISOString() })
    }
    onFight({ ...b, name: auth.profile?.pseudo || 'Toi' })
  }

  const sortedCards = Object.entries(CARDS).sort(([,x],[,y])=>{
    const fx = (y.foodType===fam || (y.food&&FOODS[y.food].fam===fam)) - (x.foodType===fam || (x.food&&FOODS[x.food].fam===fam))
    return fx || ((x.cost||0)-(y.cost||0))
  })

  return (
    <div className="screen on" id="build" style={{position:'relative'}}>
      <div className="bhead">
        <h1>BATAILLE DE PO/ETS</h1>
        <div className="bud">
          <div className={spent>BUDGET?'bad':''}>💰 {spent}/{BUDGET}<div className="bar"><i style={{width:Math.min(100,spent/BUDGET*100)+'%',background:spent>BUDGET?'#e53935':'#4caf50'}}/></div></div>
          <div className={deckCount!==DECK_SIZE?'bad':''}>🂠 {deckCount}/{DECK_SIZE}<div className="bar"><i style={{width:(deckCount/DECK_SIZE*100)+'%'}}/></div></div>
          <div className={food<8?'bad':''}>🍖 {food}<div className="bar"><i style={{width:Math.min(100,food/12*100)+'%',background:'#ff9800'}}/></div></div>
        </div>
      </div>
      <div className="bbody">
        <h2>1. Ton avatar</h2>
        <div className="avrow">
          {Object.entries(AVATARS).map(([k,a])=>(
            <div key={k} className={'av'+(b.avatar===k?' sel':'')} onClick={()=>set({avatar:k})}>
              <img src={IMG.avatarFull[k]} alt={a.n}/><b>{a.n}</b>
            </div>
          ))}
        </div>
        <h2>2. Ton animal</h2>
        <div className="grid">
          {Object.entries(CREATURES).map(([k,c])=>(
            <div key={k} className={'cre'+(b.pet===k?' sel':'')} onClick={()=>set({pet:k})}>
              <span className="pt">{c.pts}💰</span>
              <img className="ci" src={IMG.anim[k]} alt={c.n}/>
              <div className="nm">{c.n}</div>
              <span className="fam" style={{background:FAMILIES[c.f].c}}>{FAMILIES[c.f].i}</span>
              <div className="stt">❤️{c.hp} ⚡{c.spd} 💪{c.pow}</div>
              {c.t && <span className="tr">{c.t.map(t=>TRAITS[t].n).join(', ')}</span>}
            </div>
          ))}
        </div>
        <h2>3. Tes fringues</h2>
        <div className="opts">{Object.entries(TOPS).map(([k,o])=>(<div key={k} className={'opt'+(b.top===k?' sel':'')} onClick={()=>set({top:k})}><div className="e">{o.i}</div><b>{o.n}·{o.pts}💰</b>{o.d}</div>))}</div>
        <div className="opts">{Object.entries(BOTTOMS).map(([k,o])=>(<div key={k} className={'opt'+(b.bottom===k?' sel':'')} onClick={()=>set({bottom:k})}><div className="e">{o.i}</div><b>{o.n}·{o.pts}💰</b>{o.d}</div>))}</div>
        <h2>4. Ton deck <span style={{fontSize:12,fontWeight:400}}>(30 cartes, min. 8 🍖)</span></h2>
        <div className="deckbtns">
          <button id="suggestBtn" onClick={()=>set({deck:suggestedDeck(fam, BUDGET - CREATURES[b.pet].pts - TOPS[b.top].pts - BOTTOMS[b.bottom].pts)})}>✨ Deck conseillé</button>
          <button id="clearBtn" onClick={()=>set({deck:{}})}>🗑️ Vider</button>
        </div>
        <div id="deck">
          {sortedCards.map(([k,c])=>{
            const favFood=c.food&&FOODS[c.food].fam===fam, favSpell=c.foodType===fam
            return (
              <div key={k} className={'drow'+(favFood||favSpell?' fav':'')+(c.big?' bigc':'')}>
                <span className="e">{c.art}</span>
                <div className="tx">{c.food?FOODS[c.food].art:''}{c.foodType?FAMILIES[c.foodType].i:''}{c.big?'🔥':''} {c.n} · {c.pts}💰{c.cost?' · '+c.cost+'🍖':''}<small>{c.txt}</small></div>
                <button onClick={()=>sub(k)}>−</button>
                <span className="ct">{b.deck[k]||0}</span>
                <button onClick={()=>add(k)}>+</button>
              </div>
            )
          })}
        </div>
      </div>
      <div className="bfoot">
        <button className="big" disabled={!ok} onClick={fight}>
          {ok?'⚔️ COMBATTRE !':(deckCount>DECK_SIZE?`Trop de cartes (${deckCount}/${DECK_SIZE})`:deckCount<DECK_SIZE?`Deck : ${deckCount}/${DECK_SIZE}`:food<8?`Pas assez de nourriture (${food}/8)`:'Budget depasse !')}
        </button>
        <button className="testbtn" onClick={fight}>🧪 TESTER (lancer meme si deck incomplet)</button>
        <button className="onlinebtn" disabled={!ok || !(auth.online && auth.session)} onClick={()=>onOnline && onOnline({ ...b, name: auth.profile?.pseudo || 'Toi' })}>
          {(auth.online && auth.session) ? '🌐 JOUER EN LIGNE (vs un pote)' : '🌐 En ligne (connecte-toi)'}
        </button>
      </div>
    </div>
  )
}
