import { useEffect, useReducer, useRef, useState } from 'react'
import { CREATURES, SODA_MAX, FOOD_CAP, HAND_DRAW, FAMILIES, suggestedDeck } from '../data/cards.js'
import * as E from '../game/engine.js'
import { aiChooseAction, aiPocketChoices } from '../game/ai.js'
import { actionArt } from '../game/actionArt.js'
import { IMG } from '../assets/images.js'
import { supabase, online } from '../lib/supabase.js'
import Sprite from '../components/Sprite.jsx'
import Card from '../components/Card.jsx'
import Fx from '../components/Fx.jsx'

const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const CARD=E.CARD
// --- DEBUG : logs detailles (visible dans la console du navigateur F12) ---
const DBG=true
const LOG=(...a)=>{ if(DBG) console.log('%c[BDP]','color:#ff3fb4;font-weight:bold',...a) }
const SNAP=(s)=> s?({hp:s.hp+'/'+s.max,deck:s.deck.length,hand:s.hand.length,disc:s.discard.length,food:s.food+'/'+s.foodMax,fx:{...s.fx}}):null

export default function Battle({ auth, loadout, onExit, netMatch=null }){
  const [,force] = useReducer(x=>x+1,0)
  const g = useRef(null)
  const fx = useRef(null)          // controleur d'effets visuels (Fx)
  const [zoomCard,setZoomCard] = useState(null)
  const [paused,setPaused] = useState(false)
  const [fast,setFast] = useState(false)
  const pausedRef=useRef(false), fastRef=useRef(false)
  pausedRef.current=paused; fastRef.current=fast

  useEffect(()=>{ newGame(); /* eslint-disable-next-line */ },[])

  function newGame(){
    LOG('newGame() loadout=', loadout, 'netMatch=', netMatch)
    if(netMatch) LOG('🌐 PARTIE EN LIGNE connectee : match',netMatch.match.id,'role',netMatch.role)
    const seed = (Date.now() ^ (Math.random()*1e9)) >>> 0
    const rng = E.makeRng(seed)
    const petKeys = Object.keys(CREATURES)
    const oppPet = petKeys[Math.floor(rng()*petKeys.length)]
    // Deck de secours : si le deck du joueur est vide ou trop petit (bouton TEST), on le complete
    let myCards = (loadout && loadout.deck) ? {...loadout.deck} : {}
    const total = Object.values(myCards).reduce((a,b)=>a+b,0)
    if(total < 10){
      const fallback = suggestedDeck(CREATURES[loadout.pet].f)
      LOG('Deck joueur trop petit ('+total+' cartes) -> deck conseille applique', fallback)
      myCards = fallback
    }
    const me = E.makeSide({ ...loadout, cards:myCards }, true, rng)
    const oppCfg = { pet:oppPet, avatar:'h2', top:'chemisette', bottom:'jean', cards: oppDeck(oppPet), name:'Alex' }
    const opp = E.makeSide(oppCfg, false, rng)
    LOG('Joueur:', me.cr.n, 'deck='+me.deck.length, '| Adversaire:', opp.cr.n, 'deck='+opp.deck.length)
    g.current = { rng, me, opp, turn:1, active:null, busy:true, sel:null, over:false }
    force()
    startTurn(me)
  }
  // deck IA : on importe suggestedDeck proprement
  function oppDeck(pet){
    return suggestedDeck(CREATURES[pet].f)
  }

  const spd=E.spd
  const say=(t)=>{ if(g.current) g.current.msg=t; force() }

  async function startTurn(s){
    const G=g.current; G.active=s; G.sel=null; G.busy=true; force()
    LOG('startTurn', s.name, 'tour', G.turn, SNAP(s))
    const ev=E.startTurnEffects(s)
    for(const e of ev){
      if(e.type==='poison'){ fx.current?.hit(s.isMe?'me':'opp'); fx.current?.float(s.isMe?'me':'opp','-'+e.dmg+' ☠️','#9be564'); say(`${s.name} subit le poison (-${e.dmg}).`); force(); await sleep(d(600)); if(await checkEnd())return }
      if(e.type==='stun'){ await fx.current?.banner(s.isMe?'😵 TU ES SONNE !':'😵 ALEX EST SONNE !'); return endTurn(true) }
    }
    const n=HAND_DRAW-(s.fx.work?2:0); s.fx.work=0; E.drawCards(s,n)
    LOG('  pioche', n, 'cartes ->', s.name, 'main='+s.hand.length, 'deck restant='+s.deck.length)
    if(s.hand.length===0) LOG('  ⚠️ MAIN VIDE apres pioche ! deck='+s.deck.length+' discard='+s.discard.length)
    await fx.current?.banner(s.extra?'⚡ ENCORE UN TOUR !':(s.isMe?'A TOI !':'TOUR D ALEX')); s.extra=false
    if(s.isMe){ say((netMatch?`🌐 Partie en ligne (${netMatch.role==='host'?'hote':'invite'}) · `:'')+`Tour ${G.turn} : ${n} cartes. 1 nourriture max, garde tes grosses cartes en poche 👖`); G.busy=false; force() }
    else { force(); await aiPlay() }
  }
  const d=ms=> ms*(fastRef.current?0.55:1)

  async function waitContinue(){ if(!pausedRef.current)return; await new Promise(res=>{ g.current._cont=res; force() }); g.current._cont=null; force() }

  async function endTurn(skipDiscard){
    const G=g.current, s=G.active; if(G.over)return
    LOG('endTurn', s.name, 'defausse', s.hand.length, 'cartes')
    G.busy=true; G.sel=null; force()
    if(s.isMe && !skipDiscard){ s.discard.push(...s.hand); s.hand=[] } else if(!s.isMe){ s.discard.push(...s.hand); s.hand=[] }
    E.endTurnEffects(s); force()
    if(s.extra){ await fx.current?.flash(s.isMe); return startTurn(s) }
    const n = s===G.me ? G.opp : G.me
    if(n===G.me) G.turn++
    startTurn(n)
  }

  async function playCard(s, c, from){
    const G=g.current; G.busy=true; G.sel=null; fx.current?.sfx('card')
    LOG('playCard', s.name, CARD(c).n, 'from='+from, 'cout='+(E.costOf(s,c)))
    const list = from==='hand'? s.hand : s[from]; list.splice(list.indexOf(c),1); force()
    if(!s.isMe) await fx.current?.reveal(c)
    const card=CARD(c), t = s===G.me?G.opp:G.me
    if(card.type==='food'){
      const gain=Math.min(card.gain||1, FOOD_CAP-s.foodMax); s.foodPlayed=true; s.foodMax+=gain; s.food+=gain
      fx.current?.sfx('food'); say(`${s.name} pose ${card.n} : +${gain} 🍖.`); force(); await sleep(d(300))
    } else if(card.type==='soda'){
      s.soda++; s.discard.push(c); fx.current?.sfx('soda'); say(`${s.name} boit un Soda (${s.soda}/${SODA_MAX}).`); force()
      if(s.soda>=SODA_MAX){ s.soda=0; s.extra=true; say(`⚡ ${s.name} passe en FLASH !`); await fx.current?.flash(s.isMe) }
      await sleep(d(250))
    } else {
      s.food-=E.costOf(s,c); force()
      const bonus=E.famBonus(s,card)
      say(`${card.target==='pote'?s.name:(s.isMe?'Ton ':'Le ')+s.cr.n} lance ${card.n.toUpperCase()}${bonus?' ✨':''} !`)
      // animation : glissade + onomatopee geante + dessin d'action
      await fx.current?.attack(s, t, card)
      const res=E.resolveSpell(s,t,c,G.rng)
      if(res.miss){ fx.current?.sfx('dodge'); fx.current?.dodge(t.isMe?'me':'opp'); fx.current?.float(t.isMe?'me':'opp',res.miss==='ESQUIVE'?'ESQUIVE !':'RATE !','#fff',true); say(`${t.cr.n} ${res.miss==='ESQUIVE'?'esquive':'rate'} !`) }
      else {
        fx.current?.result(s,t,res)
        say(`${card.n} : ${res.texts.join(', ')}.`)
      }
      s.discard.push(c); force()
      await sleep(d(res.miss?450:650))
      if(await checkEnd())return
    }
    await waitContinue()
    G.busy=false; force()
  }

  function pocket(c){
    const s=g.current.me
    const z = s.back.length<s.backMax?'back': s.front.length<s.frontMax?'front':null; if(!z)return
    s.hand.splice(s.hand.indexOf(c),1); s[z].push(c); g.current.sel=null; fx.current?.sfx('card')
    say(z==='back'?`${CARD(c).n} planquee en poche arriere 😏`:`${CARD(c).n} en poche avant… l adversaire la voit 👀`); force()
  }

  async function checkEnd(){
    const G=g.current; if(G.me.hp>0 && G.opp.hp>0) return false
    LOG('checkEnd : fin de partie, me.hp='+G.me.hp+' opp.hp='+G.opp.hp)
    G.over=true; G.busy=true; const win=G.opp.hp<=0; force()
    fx.current?.ko(win?'opp':'me'); fx.current?.sfx(win?'win':'lose')
    await fx.current?.bigWord(win?'K.O. !':'AIE…', win?'#ffd633':'#7e57c2', win)
    if(online && auth.session){
      // enregistre le resultat (ELO simplifie)
      const prof=auth.profile
      if(prof){ const delta=win?20:-15
        await supabase.from('profiles').update({ wins:prof.wins+(win?1:0), losses:prof.losses+(win?0:1), elo:Math.max(0,prof.elo+delta) }).eq('id',auth.session.user.id) }
    }
    G.result = win; force(); return true
  }

  async function aiPlay(){
    const G=g.current; await sleep(d(300)); LOG('aiPlay debut', SNAP(G.opp))
    const food=aiChooseAction(G.opp)
    if(food && food.isFood){ await playCard(G.opp, food.card, 'hand'); if(G.over)return }
    for(let i=0;i<8;i++){ const a=aiChooseAction(G.opp); if(!a||a.isFood)break; await playCard(G.opp,a.card,a.zone); if(G.over)return }
    for(const h of aiPocketChoices(G.opp)){ const z=G.opp.back.length<G.opp.backMax?'back':G.opp.front.length<G.opp.frontMax?'front':null; if(!z)break; G.opp.hand.splice(G.opp.hand.indexOf(h),1); G.opp[z].push(h); say('Alex planque une carte 🤨'); force(); await sleep(d(400)) }
    await sleep(d(220)); endTurn()
  }

  const G=g.current
  if(!G) return <div className="screen on"/>
  const me=G.me, opp=G.opp, mine=G.active===me && !G.over
  const selCard = G.sel ? (G.sel.from==='hand'?me.hand:me[G.sel.from]).find(x=>x.id===G.sel.id) : null

  const accCursor = s => (E.accuracy(s)*100) // 0..100, 100 = plein a droite

  return (
    <div className="screen on" style={{position:'relative'}}>
      <div className="scene" id="scene">
        <div className="sky"/><div className="house h1"/><div className="house h2"/><div className="house h3"/><div className="road"/>

        {/* ===== LIGNE ADVERSAIRE (haut) : barre a gauche · animal au centre · perso a droite ===== */}
        <div className="hpbox" style={{left:6,top:6,width:168}}>
          <div className="top"><span>{opp.name} & {opp.cr.n.toUpperCase()} {FAMILIES[opp.cr.f].i}</span><span>{opp.hp}/{opp.max}</span></div>
          <div className="hpbar"><div className="hpfill" style={{width:(opp.hp/opp.max*100)+'%',background:hpCol(opp)}}/></div>
          <div className="accwrap"><div className="acclabel"><span>🎯 Precision</span><span>{Math.round(E.accuracy(opp)*100)}%</span></div>
            <div className="accbar"><div className="fill" style={{width:accCursor(opp)+'%'}}/></div></div>
          <div className="st">⚡{spd(opp)} 🍖{opp.food}/{opp.foodMax} 👖{opp.back.length} {statusTxt(opp)}</div>
        </div>
        {/* perso adverse en haut a droite */}
        <div className="ent" id="oppPote" style={{right:4,top:4,left:'auto',width:90,height:140}}>
          <img className="spr" src={IMG.oppPote} style={{width:88}} alt=""/>
          {opp.front.length>0 && <div className="oppfrontcard" style={{left:-4,top:44,fontSize:22}} onClick={()=>setZoomCard(opp.front[0])}>🂠</div>}
        </div>
        {/* animal adverse : vers le centre (un peu a gauche du milieu), regarde a droite... vers le bas */}
        <Sprite side={opp} id="oppPet" style={{right:70,top:40,left:'auto',width:120,height:120}} scale={0.8} flip/>

        {/* ===== LIGNE JOUEUR (bas) : perso a gauche · animal au centre · barre a droite ===== */}
        {/* ton perso en bas a gauche, vue aux genoux */}
        <div className="ent" id="myPote" style={{left:2,top:150,width:150,height:200,zIndex:6,overflow:'visible',alignItems:'flex-end'}}>
          <img className="spr avatarknee" src={IMG.avatarKnee[me.avatar]} alt="" style={{maxHeight:'none'}}/>
        </div>
        {/* ton animal : a droite de ton perso, vers le centre, face a l'animal adverse */}
        <Sprite side={me} id="myPet" style={{left:150,top:150,width:150,height:160,zIndex:7}} scale={1.1}/>

        {/* ressources : en bas a gauche, sous ton perso */}
        <div className="res" style={{top:'auto',bottom:6,left:6}}>
          <div className="tok" id="tokFood">🍖</div><div className="num">{me.food}<small>/{me.foodMax}</small></div>
          <div className="tok" style={{borderColor:'#ff73c8'}}>🥤</div>
          <div className="pips">{Array.from({length:SODA_MAX},(_,i)=><i key={i} className={i<me.soda?'on':''}/>)}</div>
        </div>
        {/* ta barre de vie + precision : en bas a DROITE */}
        <div className="hpbox" style={{right:6,bottom:6,top:'auto',left:'auto',width:168}}>
          <div className="top"><span>{me.name} & {me.cr.n.toUpperCase()} {FAMILIES[me.cr.f].i}</span><span>{me.hp}/{me.max}</span></div>
          <div className="hpbar"><div className="hpfill" style={{width:(me.hp/me.max*100)+'%',background:hpCol(me)}}/></div>
          <div className="accwrap"><div className="acclabel"><span>🎯 Precision</span><span>{Math.round(E.accuracy(me)*100)}%</span></div>
            <div className="accbar"><div className="fill" style={{width:accCursor(me)+'%'}}/></div></div>
          <div className="st">⚡{spd(me)} {statusTxt(me)}</div>
        </div>
        <Fx ref={fx} getG={()=>g.current} dMul={()=>fastRef.current?0.55:1} pausedRef={pausedRef}/>
      </div>

      {/* MILIEU */}
      <div className="mid">
        <div className="dialog">
          <span className="turn">TOUR {G.turn}{mine?' · TOI':' · ALEX'}</span>
          <span>{G.msg||''}</span>
          {G._cont && <button id="cont" style={{display:'block'}} onClick={()=>g.current._cont&&g.current._cont()}>SUITE ▶</button>}
        </div>
        <div className="row">
          <div className="stack"><div className="pile">{me.deck.length}</div>Pioche</div>
          <div className="stack"><div className="slots">
            {Array.from({length:me.backMax}).map((_,i)=>slot(me,'back',i,G,setSel))}
            {Array.from({length:me.frontMax}).map((_,i)=>slot(me,'front',i,G,setSel))}
          </div>👖 Poches</div>
          <div className="stack"><div className="pile disc">{me.discard.length}</div>Defausse</div>
          <button id="endBtn" disabled={G.busy||!mine} onClick={()=>!G.busy&&mine&&endTurn()}>FIN DU<br/>TOUR ▶</button>
        </div>
        <div className="toggles" style={{padding:'4px 0 0'}}>
          <button className="tg" onClick={()=>{fx.current?.toggleSound(); force()}}>🔊</button>
          <button className="tg" onClick={()=>setFast(f=>!f)}>{fast?'⏩ RAPIDE':'▶ RAPIDE'}</button>
          <button className="tg" onClick={()=>setPaused(p=>!p)}>{paused?'⏸ PAUSE':'▶ PAUSE'}</button>
          <button className="tg" onClick={()=>{ LOG('retour -> ecran deck'); onExit() }}>◀ RETOUR</button>
        </div>
      </div>

      {/* MAIN */}
      <div className="handzone">
        {selCard && mine && !G.busy && (
          <div className="actbar on">
            <div className="lbl">{CARD(selCard).n} · {costLbl(me,selCard)}{E.whyNot(me,selCard)&&<em>{E.whyNot(me,selCard)}</em>}</div>
            <button disabled={!!E.whyNot(me,selCard)} onClick={()=>playCard(me,selCard,G.sel.from)}>JOUER</button>
            {G.sel.from==='hand' && <button className="alt" disabled={me.back.length>=me.backMax&&me.front.length>=me.frontMax} onClick={()=>pocket(selCard)}>👖</button>}
            <button className="x" onClick={()=>{g.current.sel=null;force()}}>✕</button>
          </div>
        )}
        <div id="hand">
          {me.hand.length? me.hand.map((c,i)=>{
            const n=me.hand.length, off=i-(n-1)/2, sel=G.sel&&G.sel.id===c.id
            const tr = sel?`translate(${off*66}px,-54px) scale(1.12)`:`translate(${off*66}px,${off*off*5}px) rotate(${off*6}deg)`
            return <Card key={c.id} card={CARD(c)} side={me} style={{transform:tr}} disabled={mine&&!!E.whyNot(me,c)} selected={sel}
                     onClick={()=>{ if(G.busy||!mine)return; g.current.sel=sel?null:{id:c.id,from:'hand'}; force() }}/>
          }) : <div className="handmsg">{mine?'Main vide → FIN DU TOUR':'Alex reflechit… 🤔'}</div>}
        </div>
      </div>

      {/* zoom carte poche avant adverse */}
      {zoomCard && <div className="cardzoom" onClick={()=>setZoomCard(null)}><Card card={CARD(zoomCard)} side={opp}/></div>}

      {/* fin de partie */}
      {G.over && G.result!==undefined && (
        <div className="over">
          <div className="bg">{G.result?'VICTOIRE':'DEFAITE'}</div>
          <div>{G.result?'Alex est humilie 🏆':'Ton '+me.cr.n+' est KO 😵'} · {G.turn} tours</div>
          <button onClick={newGame}>REJOUER</button>
          <button onClick={onExit}>CHANGER MON DECK</button>
        </div>
      )}
    </div>
  )

  function setSel(sel){ g.current.sel=sel; force() }
}

function slot(me,z,i,G,setSel){
  const c=me[z][i]
  if(!c) return <div key={z+i} className={'slot empty '+z}>vide</div>
  const sel=G.sel&&G.sel.id===c.id
  return <div key={z+i} className={'slot t-'+CARD(c).type+' '+z+(sel?' sel':'')} onClick={()=>{ if(G.busy||G.active!==me)return; setSel(sel?null:{id:c.id,from:z}) }}>{CARD(c).art}</div>
}
const hpCol=s=>{const p=s.hp/s.max; return p>.5?'#4caf50':p>.25?'#ff9800':'#f44336'}
const costLbl=(s,c)=>{const d=CARD(c); if(d.type==='food')return '+'+(d.gain||1)+'🍖'; if(d.type==='soda')return '+1⚡'; return E.costOf(s,c)+'🍖'}
function statusTxt(s){const f=s.fx,o=[];if(f.poison)o.push('☠️'+f.poison);if(f.eyes)o.push('😵'+f.eyes);if(f.slow)o.push('🐌'+f.slow);if(f.blind)o.push('🏖️');if(f.fear)o.push('😱'+f.fear);if(f.work)o.push('💼');if(f.haste)o.push('🪶'+f.haste);if(f.stun)o.push('💫');if(s.shield)o.push('🫧'+s.shield);return o.join(' ')}
