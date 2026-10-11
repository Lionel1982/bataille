import { useState } from 'react'
import { CREATURES, CARDS, BUDGET, DECK_SIZE } from '../data/cards.js'
import { IMG } from '../assets/images.js'
import { VERSION } from '../version.js'
import { supabase, online } from '../lib/supabase.js'
import { getSetting } from '../lib/settings.js'

// Ecran d'accueil : 4 tuiles (Jouer / Avatar / Familier / Deck).
// 'Jouer' ouvre un sous-menu : Creer / Rejoindre / IA.
export default function Home({ auth, ld, go, onFight, onOnline, onJoin, resumable, onResume }){
  const connected = auth.online && auth.session
  const { b } = ld
  const [playOpen,setPlayOpen] = useState(false)

  const deckCount = Object.values(b.deck).reduce((a,c)=>a+c,0)
  const deckPts = Object.entries(b.deck).reduce((a,[k,v])=>a+v*CARDS[k].pts,0)
  const spent = CREATURES[b.pet].pts + deckPts
  const food = Object.entries(b.deck).filter(([k])=>CARDS[k].type==='food').reduce((a,[k,v])=>a+v*(CARDS[k].gain||1),0)
  const deckReady = (deckCount===DECK_SIZE && food>=8 && spent<=BUDGET) || getSetting('allowIncomplete')

  async function saveDeck(){
    if(online && auth.session){
      try{ await supabase.from('decks').upsert({ owner:auth.session.user.id, name:'Mon deck', pet:b.pet, top:b.top, bottom:b.bottom, cards:b.deck, updated_at:new Date().toISOString() }) }catch(e){}
    }
  }
  const loadout = ()=>({ ...b, name: auth.profile?.pseudo || 'Toi' })

  return (
    <div className="home">
      <div className="hometop">
        <button onClick={()=>go('account')}>👤 {connected?(auth.profile?.pseudo||'Compte'):'Compte'}</button>
        <button onClick={()=>go('lead')}>🏆 Classement</button>
        <button onClick={()=>go('shop')}>🛒 Boutique</button>
      </div>
      <h1 className="hometitle">BATAILLE<br/>DE PO/ETS</h1>
      {resumable && !playOpen && <button className="tile resume" onClick={onResume}><span className="ti">▶️</span><span className="tl">REPRENDRE LA PARTIE</span></button>}

      {!playOpen ? <>
        <button className="tile play" onClick={()=>setPlayOpen(true)}>
          <span className="ti">⚔️</span><span className="tl">JOUER</span>
        </button>
        <div className="tilerow">
          <button className="tile" onClick={()=>go('avatar')}>
            <img className="tileimg" src={IMG.avatarFull[b.avatar]} alt=""/><span className="tl">AVATAR</span>
          </button>
          <button className="tile" onClick={()=>go('familier')}>
            <img className="tileimg" src={IMG.anim[b.pet]} alt=""/><span className="tl">FAMILIER</span>
          </button>
        </div>
        <button className="tile deck" onClick={()=>go('deck')}>
          <span className="ti">🃏</span><span className="tl">DECK</span>
          <span className="tbadge">{deckReady?'✓ pret':deckCount+'/'+DECK_SIZE}</span>
        </button>
      </> : <>
        <h2 className="submenu">Jouer</h2>
        <button className="tile" disabled={!deckReady||!(online&&auth.session)}
          onClick={async()=>{ await saveDeck(); onOnline(loadout()) }}>
          <span className="ti">➕</span><span className="tl">CREER UNE PARTIE</span>
          {!(online&&auth.session) && <span className="tbadge">connecte-toi</span>}
        </button>
        <button className="tile" disabled={!deckReady||!(online&&auth.session)}
          onClick={async()=>{ await saveDeck(); onJoin(loadout()) }}>
          <span className="ti">🔑</span><span className="tl">REJOINDRE UNE PARTIE</span>
        </button>
        <button className="tile" onClick={async()=>{ await saveDeck(); onFight(loadout()) }}>
          <span className="ti">🤖</span><span className="tl">MODE IA (solo)</span>
          {!deckReady && <span className="tbadge">deck incomplet : test</span>}
        </button>
        <button className="link" onClick={()=>setPlayOpen(false)}>◀ Retour</button>
      </>}
      <div className="verfoot">v{VERSION}</div>
      </div>
  )
}