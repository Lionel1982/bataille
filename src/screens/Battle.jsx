import { useEffect, useReducer, useRef, useState } from 'react'
import { CREATURES, SODA_MAX, FOOD_CAP, HAND_DRAW, FAMILIES, suggestedDeck } from '../data/cards.js'
import * as E from '../game/engine.js'
import { aiChooseAction, aiPocketChoices } from '../game/ai.js'
import { actionArt } from '../game/actionArt.js'
import { IMG } from '../assets/images.js'
import { supabase, online } from '../lib/supabase.js'
import { openMatchChannel, sendAction, firstPlayerIsHost, fetchMatch } from '../lib/online.js'
import { awardPoints } from '../lib/economy.js'
import { getSetting } from '../lib/settings.js'
import Sprite from '../components/Sprite.jsx'
import Card from '../components/Card.jsx'
import Fx from '../components/Fx.jsx'

const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const CARD=E.CARD
// --- DEBUG : logs detailles (visible dans la console du navigateur F12) ---
const DBG=()=>getSetting('debugLogs')!==false
const LOG=(...a)=>{ if(DBG()) console.log('%c[BDP]','color:#ff3fb4;font-weight:bold',...a) }
const SNAP=(s)=> s?({hp:s.hp+'/'+s.max,deck:s.deck.length,hand:s.hand.length,disc:s.discard.length,food:s.food+'/'+s.foodMax,fx:{...s.fx}}):null

export default function Battle({ auth, loadout, onExit, onHome, onGameOver, netMatch=null }){
  const [,force] = useReducer(x=>x+1,0)
  const g = useRef(null)
  const fx = useRef(null)          // controleur d'effets visuels (Fx)
  const [zoomCard,setZoomCard] = useState(null)
  const [paused,setPaused] = useState(false)
  const [fast,setFast] = useState(false)
  const pausedRef=useRef(false), fastRef=useRef(false)
  pausedRef.current=paused; fastRef.current=fast
  const closeChan = useRef(null)
  useEffect(()=>()=>{ if(closeChan.current) closeChan.current() },[])

  useEffect(()=>{ newGame(); /* eslint-disable-next-line */ },[])

  function newGame(){
    LOG('newGame() loadout=', loadout, 'netMatch=', netMatch)
    const rng = E.makeRng((Date.now() ^ (Math.random()*1e9)) >>> 0)
    // --- deck du joueur (avec filet de secours) ---
    let myCards = (loadout && loadout.deck) ? {...loadout.deck} : {}
    if(Object.values(myCards).reduce((a,b)=>a+b,0) < 10) myCards = suggestedDeck(CREATURES[loadout.pet].f)
    const me = E.makeSide({ ...loadout, cards:myCards }, true, rng)

    if(netMatch){
      // ===== MODE EN LIGNE : l'adversaire est un HUMAIN =====
      startOnline(me, rng)
      return
    }


    // ===== MODE SOLO (vs IA) =====
    const petKeys = Object.keys(CREATURES)
    const oppPet = petKeys[Math.floor(rng()*petKeys.length)]
    const opp = E.makeSide({ pet:oppPet, avatar:'h2', top:'chemisette', bottom:'jean', cards: oppDeck(oppPet), name:'Alex' }, false, rng)
    g.current = { rng, me, opp, turn:1, active:null, busy:true, sel:null, over:false, net:false }
    force()
    startTurn(me)
  }
  // deck IA : on importe suggestedDeck proprement
  function oppDeck(pet){
    return suggestedDeck(CREATURES[pet].f)
  }

  // Demarrage d'une partie EN LIGNE : recharge le match (2 decks surs), construit l'adversaire humain,
  // ouvre le canal temps reel, applique le tirage au sort.
  async function startOnline(me, rng){
    let m = netMatch.match
    // recharger pour etre sur d'avoir guest_deck ET host_deck a jour
    try{ const fresh = await fetchMatch(m.id); if(fresh) m = fresh }catch(e){ LOG('fetchMatch err', e.message) }
    const oppRaw = netMatch.role==='host' ? m.guest_deck : m.host_deck
    const oppLoadout = (oppRaw && oppRaw.pet) ? oppRaw : { pet:'chien', avatar:'h2', deck:{} }
    let oppCards = oppLoadout.deck || oppLoadout.cards || {}
    if(Object.values(oppCards).reduce((a,b)=>a+b,0) < 10) oppCards = suggestedDeck(CREATURES[oppLoadout.pet].f)
    const opp = E.makeSide({ ...oppLoadout, cards:oppCards, name: oppLoadout.name||'Adversaire' }, false, rng)
    LOG('🌐 adversaire charge :', opp.cr.n, 'avatar', opp.avatar, 'deck', opp.deck.length)
    const hostFirst = firstPlayerIsHost(m.id)
    const iStart = (netMatch.role==='host') === hostFirst
    LOG('🌐 role', netMatch.role, '| je commence :', iStart)
    g.current = { rng, me, opp, turn:1, active:null, busy:true, sel:null, over:false, net:true, role:netMatch.role, matchId:m.id }
    if(closeChan.current) closeChan.current()
    closeChan.current = openMatchChannel(m.id, {
      onAction: handleRemoteAction,
      onPresence: (n)=>LOG('presence online:', n)
    })
    force()
    if(iStart){ say('🌐 Connexion… tu commences'); setTimeout(()=>startTurn(me), 1500) }
    else { say('🌐 Ton adversaire commence…'); waitRemoteTurn() }
  }

  // ===== SYNCHRO EN LIGNE =====
  // J'applique une action recue de l'adversaire sur MON "opp" (= lui), et je rejoue l'anim.
  async function handleRemoteAction(a){
    const G=g.current; if(!G||!G.net||G.over) return
    LOG('⇐ action distante', a.kind, a)
    const s=G.opp, t=G.me
    if(a.kind==='play'){
      G.busy=true; force()
      const card = CARD({key:a.key})
      // retirer une carte equivalente de la main/poches de opp (on gere opp "en aveugle")
      removeOneFromOpp(s, a.key, a.from)
      s.pa=Math.max(0,s.pa-E.paCostOf({key:a.key}))
      say(`${s.name} joue ${card.n}.`); force()
      await fx.current?.reveal({key:a.key})
      if(card.type==='food'){ const g2=Math.min(card.gain||1,FOOD_CAP-s.foodMax); s.foodMax+=g2; s.food+=g2; fx.current?.sfx('food') }
      else if(card.type==='soda'){ s.soda++; fx.current?.sfx('soda'); if(s.soda>=SODA_MAX){s.soda=0; s.extra=true; await fx.current?.flash(false)} }
      else {
        const effTarget = a.target || card.target
        const effCard = {...card, target: effTarget}
        await fx.current?.attack(s, t, effCard)
        // on APPLIQUE le resultat transmis (pas de recalcul => pas de divergence)
        applyRemoteResult(a.res, s, t, effCard)
        say(`${card.n} : ${(a.res&&a.res.texts||[]).join(', ')}.`)
      }
      force(); await sleep(d(400))
      if(await checkEnd()) return
      G.busy=false; force()
    }
    else if(a.kind==='endturn'){
      // l'adversaire a fini : a moi de jouer
      LOG('⇐ fin de tour distante -> a moi')
      // defausser la main de opp (comme il l'a fait chez lui)
      s.discard.push(...s.hand); s.hand=[]
      E.endTurnEffects(s)
      G.turn++
      startTurn(G.me)
    }
    else if(a.kind==='surrender'){ G.over=true; say('Adversaire a quitte.'); force() }
  }

  // Retire une carte de la main de opp (ou d'une poche). On ne connait pas sa main exacte -> on
  // enleve n'importe quelle carte (compteur), l'affichage de opp reste indicatif.
  function removeOneFromOpp(s, key, from){
    const zone = (from==='back'||from==='front') ? s[from] : s.hand
    let i = zone.findIndex(c=>c.key===key); if(i<0) i = s.hand.findIndex(c=>c.key===key)
    if(i>=0){ (zone[i]?zone:s.hand).splice(i,1) }
    else if(s.hand.length) s.hand.pop()
  }
  // Applique un resultat transmis par l'autre joueur (degats/etats deja calcules chez lui).
  function applyRemoteResult(res, atk, def, card){
    if(!res) return
    if(res.miss){ fx.current?.dodge(def.isMe?'me':'opp'); fx.current?.float(def.isMe?'me':'opp',res.miss==='ESQUIVE'?'ESQUIVE !':'RATE !','#fff',true); return }
    if(typeof res.defHp==='number') def.hp=res.defHp
    if(typeof res.defPhp==='number') def.php=res.defPhp
    if(typeof res.atkHp==='number') atk.hp=res.atkHp
    if(typeof res.atkConf==='number') atk.conf=res.atkConf
    if(typeof res.atkAggro==='number') atk.aggro=res.atkAggro
    if(res.dmg){ const who=res.hitPerso?(def.isMe?'me':'opp'):(def.isMe?'me':'opp'); fx.current?.result(atk,def,{dmg:res.dmg,texts:res.texts||[]}) }
    if(res.fxDef) def.fx={...def.fx,...res.fxDef}
  }

  // Passe mon ecran en lecture seule en attendant l'action distante.
  function waitRemoteTurn(){ const G=g.current; if(!G)return; G.active=G.opp; G.busy=true; force() }

  // Envoi d'une action que JE viens de faire (pour que l'autre la rejoue).
  function emit(kind, extra){ if(g.current&&g.current.net){ LOG('⇒ EMIT', kind, extra&&extra.key?extra.key:''); sendAction({ kind, ...extra }) } }


  const spd=E.spd
  const say=(t)=>{ if(g.current) g.current.msg=t; force() }

  async function startTurn(s){
    const G=g.current; G.active=s; G.sel=null; G.busy=true; force()
    LOG('startTurn', s.name, 'tour', G.turn, SNAP(s), 'PA='+s.pa+'/'+s.paMax+' conf='+s.conf+' aggro='+s.aggro)
    const ev=E.startTurnEffects(s, G.rng)
    for(const e of ev){
      if(e.type==='poison'){ fx.current?.hit(s.isMe?'me':'opp'); fx.current?.float(s.isMe?'me':'opp','-'+e.dmg+' ☠️','#9be564'); say(`${s.name} : le familier subit le poison (-${e.dmg}).`); force(); await sleep(d(600)); if(await checkEnd())return }
      if(e.type==='selfpoison'){ fx.current?.hitPerso&&fx.current.hitPerso(s.isMe?'me':'opp'); fx.current?.float(s.isMe?'me':'opp','-'+e.dmg+' 💉','#b39ddb'); say(`${s.name} : l'accelerateur poison ronge le perso (-${e.dmg}).`); force(); await sleep(d(500)); if(await checkEnd())return }
      if(e.type==='turn'){ await fx.current?.banner('😾 '+(s.isMe?'TON':'LE')+' FAMILIER SE RETOURNE !'); const self=Math.round(6*E.aggroMul(s)); s.php=Math.max(0,s.php-self); fx.current?.float(s.isMe?'me':'opp','-'+self+' 😾','#e53935'); say(`${s.cr.n} mord son maitre ! (-${self} PV perso)`); force(); await sleep(d(800)); if(await checkEnd())return }
      if(e.type==='calmed'){ say(`${s.cr.n} se calme.`); force(); await sleep(d(300)) }
      if(e.type==='stun'){ await fx.current?.banner(s.isMe?'😵 TU ES SONNE !':'😵 ALEX EST SONNE !'); return endTurn(true) }
    }
    const n=HAND_DRAW-(s.fx.work?2:0); s.fx.work=0; E.drawCards(s,n)
    LOG('  pioche', n, 'cartes ->', s.name, 'main='+s.hand.length, 'deck restant='+s.deck.length)
    if(s.hand.length===0) LOG('  ⚠️ MAIN VIDE apres pioche ! deck='+s.deck.length+' discard='+s.discard.length)
    await fx.current?.banner(s.extra?'⚡ ENCORE UN TOUR !':(s.isMe?'A TOI !':'TOUR D ALEX')); s.extra=false
    if(s.isMe){ say((G.net?'🌐 ':'')+`Tour ${G.turn} : ${n} cartes. 1 PA = 1 action, nourriture pour les sorts 👖`); G.busy=false; force() }
    else if(G.net){ /* en ligne : l'adversaire humain joue de son cote, on attend ses actions */ G.busy=true; force() }
    else { force(); await aiPlay() }
  }
  const d=ms=> ms*(fastRef.current?0.55:1)

  async function waitContinue(){ if(!pausedRef.current)return; await new Promise(res=>{ g.current._cont=res; force() }); g.current._cont=null; force() }

  async function endTurn(skipDiscard){
    const G=g.current, s=G.active; if(G.over)return
    LOG('endTurn', s.name, 'defausse', s.hand.length, 'cartes', 'net='+!!G.net)
    G.busy=true; G.sel=null; force()
    if(s.hand.length && !skipDiscard){ s.discard.push(...s.hand); s.hand=[] }
    E.endTurnEffects(s); force()
    if(s.extra){ await fx.current?.flash(s.isMe); return startTurn(s) }
    // ===== EN LIGNE : je passe la main a l'humain d'en face =====
    if(G.net){
      if(s.isMe){ emit('endturn',{}); say('🌐 Au tour de ton adversaire…'); waitRemoteTurn() }
      // si c'etait le tour distant (gere par handleRemoteAction), startTurn(me) est deja appele la-bas
      return
    }
    // ===== SOLO =====
    const n = s===G.me ? G.opp : G.me
    if(n===G.me) G.turn++
    startTurn(n)
  }

  async function playCard(s, c, from){
    const G=g.current; G.busy=true; G.sel=null; fx.current?.sfx('card')
    LOG('playCard', s.name, CARD(c).n, 'from='+from, 'PA='+s.pa, 'nourriture='+(E.costOf(s,c)))
    s.pa = Math.max(0, s.pa - E.paCostOf(c))   // PA = paCost (0 si attaque familier)
    const list = from==='hand'? s.hand : s[from]; list.splice(list.indexOf(c),1); force()
    if(!s.isMe) await fx.current?.reveal(c)
    const card=CARD(c), t = s===G.me?G.opp:G.me
    if(card.type==='food'){
      const gain=Math.min(card.gain||1, FOOD_CAP-s.foodMax); s.foodPlayed=true; s.foodMax+=gain; s.food+=gain
      fx.current?.sfx('food'); say(`${s.name} pose ${card.n} : +${gain} 🍖.`); force()
      if(G.net && s.isMe) emit('play',{ key:c.key, from })
      await sleep(d(300))
    } else if(card.type==='soda'){
      s.soda++; s.discard.push(c); fx.current?.sfx('soda'); say(`${s.name} boit un Soda (${s.soda}/${SODA_MAX}).`); force()
      if(G.net && s.isMe) emit('play',{ key:c.key, from })
      if(s.soda>=SODA_MAX){ s.soda=0; s.extra=true; say(`⚡ ${s.name} passe en FLASH !`); await fx.current?.flash(s.isMe) }
      await sleep(d(250))
    } else {
      s.food-=E.costOf(s,c); force()
      const bonus=E.famBonus(s,card)
      // cible mixte : carte 'choose' -> cible decidee (joueur via UI, IA via heuristique)
      let effCard=card
      if(card.target==='choose'){
        let aim = s.isMe ? (G.chooseTarget||'pet') : (t.hp>t.max*0.5?'perso':'pet')
        effCard={...card, target: aim==='perso'?'perso':'pet'}
        G.chooseTarget=null
      }
      say(`${effCard.target==='perso'?s.name:(s.isMe?'Ton ':'Le ')+s.cr.n} lance ${card.n.toUpperCase()}${bonus?' ✨':''} !`)
      await fx.current?.attack(s, t, effCard)
      const res=E.resolveSpell(s,t,c,G.rng, card.target==='choose'?effCard.target:undefined)
      if(res.miss){ fx.current?.sfx('dodge'); fx.current?.dodge(t.isMe?'me':'opp'); fx.current?.float(t.isMe?'me':'opp',res.miss==='ESQUIVE'?'ESQUIVE !':'RATE !','#fff',true); say(`${t.cr.n} ${res.miss==='ESQUIVE'?'esquive':'rate'} !`) }
      else {
        fx.current?.result(s,t,res)
        say(`${card.n} : ${res.texts.join(', ')}.`)
      }
      // EN LIGNE : transmettre l'action + le resultat deja calcule (pas de recalcul chez l'autre)
      if(G.net && s.isMe){
        emit('play',{ key:c.key, from, target: effCard.target,
          res:{ miss:res.miss, dmg:res.dmg, texts:res.texts, hitPerso:res.hitPerso,
                defHp:t.hp, defPhp:t.php, atkHp:s.hp, atkConf:s.conf, atkAggro:s.aggro, fxDef:{...t.fx} } })
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
    const G=g.current
    // Perso a 0 PV : pas de mort immediate -> penalite (un PA max en moins + confiance du familier qui chute)
    for(const s of [G.me,G.opp]){
      if(s.php<=0 && !s._persoKO){ s._persoKO=true; s.paMax=Math.max(1,s.paMax-1); s.pa=Math.min(s.pa,s.paMax); E.addConfidence(s,-30,false)
        LOG('perso KO ->',s.name,'penalite PA/confiance'); say(`${s.name} : le perso est au tapis ! Le familier doute (-confiance).`); force() }
    }
    // Defaite = familier KO
    if(G.me.hp>0 && G.opp.hp>0) return false
    LOG('checkEnd : fin de partie, me.hp='+G.me.hp+' opp.hp='+G.opp.hp)
    G.over=true; G.busy=true; const win=G.opp.hp<=0; force()
    fx.current?.ko(win?'opp':'me'); fx.current?.sfx(win?'win':'lose')
    await fx.current?.bigWord(win?'K.O. !':'AIE…', win?'#ffd633':'#7e57c2', win)
    if(online && auth.session){
      // enregistre le resultat (ELO simplifie)
      const prof=auth.profile
      if(prof){ const delta=win?20:-15
        await supabase.from('profiles').update({ wins:prof.wins+(win?1:0), losses:prof.losses+(win?0:1), elo:Math.max(0,prof.elo+delta) }).eq('id',auth.session.user.id) }
      // points de boutique : +3 victoire / +1 defaite
      try{ const tot=await awardPoints(win); if(tot!=null){ G.shopPoints=tot; LOG('points boutique ->',tot) } }catch(e){ LOG('awardPoints err',e.message) }
    }
    G.result = win; if(onGameOver) onGameOver(); force(); return true
  }

  async function aiPlay(){
    const G=g.current; await sleep(d(300)); LOG('aiPlay debut', SNAP(G.opp))
    const food=aiChooseAction(G.opp)
    if(G.opp.pa>0 && food && food.isFood){ await playCard(G.opp, food.card, 'hand'); if(G.over)return }
    for(let i=0;i<10;i++){
      const a=aiChooseAction(G.opp); if(!a||a.isFood) break
      if(E.paCostOf(a.card) > G.opp.pa) break   // plus de PA pour une action du lanceur
      await playCard(G.opp,a.card,a.zone); if(G.over)return
    }
    for(const h of aiPocketChoices(G.opp)){ const z=G.opp.back.length<G.opp.backMax?'back':G.opp.front.length<G.opp.frontMax?'front':null; if(!z)break; G.opp.hand.splice(G.opp.hand.indexOf(h),1); G.opp[z].push(h); say('Alex planque une carte 🤨'); force(); await sleep(d(400)) }
    await sleep(d(220)); endTurn()
  }

  const G=g.current
  if(!G) return <div className="screen on"/>
  const me=G.me, opp=G.opp, mine=G.active===me && !G.over
  const selCard = G.sel ? (G.sel.from==='hand'?me.hand:me[G.sel.from]).find(x=>x.id===G.sel.id) : null


  return (
    <div className="screen on" style={{position:'relative'}}>
      <div className="scene" id="scene">
        <div className="sky"/><div className="house h1"/><div className="house h2"/><div className="house h3"/><div className="road"/>

        {/* ===== LIGNE ADVERSAIRE (haut) : barre a gauche · animal au centre · perso a droite ===== */}
        <div className="hpbox" style={{left:6,top:6,width:176}}>{paGauge(opp,'right')}
          <div className="top"><span>{opp.name} 🧑</span><span>❤️{opp.php}/{opp.phpMax}</span></div>
          <div className="hpbar perso"><div className="hpfill" style={{width:(opp.php/opp.phpMax*100)+'%',background:'#ff7043'}}/></div>
          <div className="top" style={{marginTop:2}}><span>{opp.cr.n.toUpperCase()} {FAMILIES[opp.cr.f].i}</span><span>{opp.hp}/{opp.max}</span></div>
          <div className="hpbar"><div className="hpfill" style={{width:(opp.hp/opp.max*100)+'%',background:hpCol(opp)}}/></div>
          {accBar(opp)}
          {spdBar(opp)}
          {gauges(opp)}
          <div className="st">🍖{opp.food}/{opp.foodMax} 👖{opp.back.length} {statusTxt(opp)}</div>
        </div>
        {/* perso adverse en haut a droite */}
        <div className="ent" id="oppPote" style={{right:4,top:4,left:'auto',width:90,height:140}}>
          <img className="spr" src={IMG.avatarFull[opp.avatar]||IMG.oppPote} style={{width:88}} alt=""/>
          {opp.front.length>0 && <div className="oppfrontcard" style={{left:-4,top:44,fontSize:22}} onClick={()=>setZoomCard(opp.front[0])}>🂠</div>}
        </div>
        {/* animal adverse : vers le centre (un peu a gauche du milieu), regarde a droite... vers le bas */}
        <Sprite side={opp} id="oppPet" style={{right:120,top:46,left:'auto',width:120,height:120,zIndex:9}} scale={0.7}/>

        {/* ===== LIGNE JOUEUR (bas) : perso a gauche · animal au centre · barre a droite ===== */}
        {/* ton perso en bas a gauche, vue aux genoux */}
        <div className="ent" id="myPote" style={{left:2,top:150,width:150,height:200,zIndex:6,overflow:'visible',alignItems:'flex-end'}}>
          <img className="spr avatarknee" src={IMG.avatarKnee[me.avatar]} alt="" style={{maxHeight:'none'}}/>
        </div>
        {/* ton animal : a droite de ton perso, vers le centre, face a l'animal adverse */}
        <Sprite side={me} id="myPet" style={{left:140,top:152,width:150,height:160,zIndex:9}} scale={0.99} mine/>

        {/* ressources : en bas a gauche, sous ton perso */}
        <div className="res" style={{top:'auto',bottom:6,left:6}}>
          <div className="tok" id="tokFood">🍖</div><div className="num">{me.food}<small>/{me.foodMax}</small></div>
          <div className="tok" style={{borderColor:'#ff73c8'}}>🥤</div>
          <div className="pips">{Array.from({length:SODA_MAX},(_,i)=><i key={i} className={i<me.soda?'on':''}/>)}</div>
        </div>
        {/* ta barre de vie + precision : en bas a DROITE */}
        <div className="hpbox" style={{right:6,bottom:6,top:'auto',left:'auto',width:176}}>{paGauge(me,'left')}
          <div className="top"><span>{me.name} 🧑</span><span>❤️{me.php}/{me.phpMax}</span></div>
          <div className="hpbar perso"><div className="hpfill" style={{width:(me.php/me.phpMax*100)+'%',background:'#ff7043'}}/></div>
          <div className="top" style={{marginTop:2}}><span>{me.cr.n.toUpperCase()} {FAMILIES[me.cr.f].i}</span><span>{me.hp}/{me.max}</span></div>
          <div className="hpbar"><div className="hpfill" style={{width:(me.hp/me.max*100)+'%',background:hpCol(me)}}/></div>
          {accBar(me)}
          {spdBar(me)}
          {gauges(me)}
          <div className="st">{statusTxt(me)}</div>
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
          {G.net
            ? <button className="tg" onClick={()=>{ LOG('quitter partie en ligne'); onExit() }}>◀ QUITTER</button>
            : <>
                <button className="tg" onClick={()=>{ LOG('menu (reprendre possible)'); onHome&&onHome() }}>⌂ MENU</button>
                <button className="tg" onClick={()=>{ LOG('abandonner'); onGameOver&&onGameOver(); onExit() }}>🏳️</button>
              </>}
        </div>
      </div>

      {/* MAIN */}
      <div className="handzone">
        {selCard && mine && !G.busy && (
          <div className="actbar on">
            <div className="lbl">{CARD(selCard).n} · {costLbl(me,selCard)}{(E.whyNot(me,selCard)||E.paCostOf(selCard)>me.pa)&&<em>{E.whyNot(me,selCard)||'0 point d action'}</em>}</div>
            {CARD(selCard).target==='choose' ? <>
              <button disabled={!!E.whyNot(me,selCard)||E.paCostOf(selCard)>me.pa} onClick={()=>{g.current.chooseTarget='pet';playCard(me,selCard,G.sel.from)}}>🎯 Familier</button>
              <button disabled={!!E.whyNot(me,selCard)||E.paCostOf(selCard)>me.pa} onClick={()=>{g.current.chooseTarget='perso';playCard(me,selCard,G.sel.from)}}>🎯 Perso</button>
            </> : <button disabled={!!E.whyNot(me,selCard) || E.paCostOf(selCard)>me.pa} onClick={()=>playCard(me,selCard,G.sel.from)}>JOUER</button>}
            {G.sel.from==='hand' && <button className="alt" disabled={me.back.length>=me.backMax&&me.front.length>=me.frontMax} onClick={()=>pocket(selCard)}>👖</button>}
            <button className="x" onClick={()=>{g.current.sel=null;force()}}>✕</button>
          </div>
        )}
        <div id="hand">
          {me.hand.length? me.hand.map((c,i)=>{
            const n=me.hand.length, off=i-(n-1)/2, sel=G.sel&&G.sel.id===c.id
            const tr = sel?`translate(${off*66}px,-54px) scale(1.12)`:`translate(${off*66}px,${off*off*5}px) rotate(${off*6}deg)`
            return <Card key={c.id} card={CARD(c)} side={me} style={{transform:tr}} disabled={mine&&(!!E.whyNot(me,c)||E.paCostOf(c)>me.pa)} selected={sel}
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

// Barre de precision : remplissage + couleur par palier (valeur % cachee, couleur = avertissement)
function accBar(s){
  const pct=Math.round(E.accuracy(s)*100)
  const tier=E.accTier(pct)
  return (
    <div className="accwrap">
      <div className="acclabel"><span>🎯 Precision</span><span style={{color:tier.col}}>{tier.name}</span></div>
      <div className="accbar"><div className="fill" style={{width:pct+'%',background:tier.col}}/></div>
    </div>
  )
}
// Jauges confiance (coeur) et agressivite (crans)
function gauges(s){
  const confPct=Math.round((s.conf/E.CONF_MAX)*100)
  return (
    <div className="gauges">
      <div className="g"><span>💙 Confiance</span><div className="gbar"><div className="gfill conf" style={{width:confPct+'%'}}/></div></div>
      <div className="g"><span>😡 Agressivite</span><div className="aggro">{Array.from({length:E.AGGRO_MAX},(_,i)=><i key={i} className={i<s.aggro?'on':''}/>)}</div></div>
      {s.turned>0 && <div className="turned">😾 RETOURNE !</div>}
    </div>
  )
}

// Jauge verticale de points d'action, accolee a la boite (side=left/right)
function paGauge(s, sidePos){
  const pips=[]
  for(let i=0;i<s.paMax;i++) pips.push(<i key={i} className={i<s.pa?'on':''}/>)
  return <div className={'pagauge '+sidePos} title={'Points d action : '+s.pa+'/'+s.paMax}>{pips}</div>
}

// Barre de vitesse du familier (combinee a la precision => esquive). Max visuel 8.
function spdBar(s){
  const v=E.spd(s); const pct=Math.min(100, v/8*100)
  return (
    <div className="accwrap">
      <div className="acclabel"><span>⚡ Vitesse</span><span>{v}</span></div>
      <div className="spdbar"><div className="fill" style={{width:pct+'%'}}/></div>
    </div>
  )
}
