import { useState, useEffect, useRef } from 'react'
import { useAuth } from './lib/useAuth.js'
import { useLoadout } from './lib/useLoadout.js'
import Auth from './screens/Auth.jsx'
import Home from './screens/Home.jsx'
import AvatarScreen from './screens/AvatarScreen.jsx'
import FamilierScreen from './screens/FamilierScreen.jsx'
import DeckScreen from './screens/DeckScreen.jsx'
import Battle from './screens/Battle.jsx'
import Leaderboard from './screens/Leaderboard.jsx'
import Online from './screens/Online.jsx'
import Shop from './screens/Shop.jsx'
import Account from './screens/Account.jsx'
import SkinsScreen from './screens/SkinsScreen.jsx'
import { loadManifest } from './lib/skins.js'

export default function App(){
  const auth = useAuth()
  const ld = useLoadout()
  const [screen,setScreenRaw] = useState('home')
  const [loadout,setLoadout] = useState(null)
  const [netMatch,setNetMatch] = useState(null)
  const [onlineMode,setOnlineMode] = useState('menu')
  const [resumable,setResumable] = useState(false)   // une partie IA est-elle en cours ?
  const [battleKey,setBattleKey] = useState(0)        // force un remount a chaque nouvelle partie
  const screenRef = useRef('home'); screenRef.current = screen

  // Navigation + bouton RETOUR du telephone (API history).
  function go(s){ setScreenRaw(s); try{ history.pushState({s},'') }catch(e){} }
  const setScreen = go
  useEffect(()=>{
    try{ history.replaceState({s:'home'},'') }catch(e){}
    loadManifest()
    const onPop = ()=>{
      // bouton retour tel : revenir a l'accueil au lieu de quitter l'appli
      const cur = screenRef.current
      if(cur==='home'){ try{ history.pushState({s:'home'},'') }catch(e){} }  // bloque la sortie
      else { setScreenRaw('home'); try{ history.pushState({s:'home'},'') }catch(e){} }
    }
    window.addEventListener('popstate', onPop)
    return ()=> window.removeEventListener('popstate', onPop)
  },[])

  if(auth.loading) return <div className="phone"><div className="auth"><h1>⚔️</h1></div></div>
  if(screen==='auth') return <div className="phone"><Auth auth={auth} onBack={()=>setScreen('home')} /></div>

  return (
    <div className="phone">
      {screen==='home' && <Home auth={auth} ld={ld} go={setScreen}
        resumable={resumable} onResume={()=>setScreen('battle')}
        onFight={(cfg)=>{ setLoadout(cfg); setNetMatch(null); setResumable(true); setBattleKey(k=>k+1); setScreen('battle') }}
        onOnline={(cfg)=>{ setLoadout(cfg); setOnlineMode('create'); setScreen('online') }}
        onJoin={(cfg)=>{ setLoadout(cfg); setOnlineMode('join'); setScreen('online') }} />}

      {screen==='avatar'   && <AvatarScreen   ld={ld} onBack={()=>setScreen('home')} onSkins={()=>setScreen('skins')} />}
      {screen==='familier' && <FamilierScreen ld={ld} onBack={()=>setScreen('home')} />}
      {screen==='deck'     && <DeckScreen     ld={ld} onBack={()=>setScreen('home')} />}

      {/* La bataille reste MONTEE quand on va au menu (display:none) pour pouvoir REPRENDRE (solo IA). */}
      {(screen==='battle' || resumable) && (
        <div style={{display: screen==='battle'?'block':'none', position:'absolute', inset:0}}>
          <Battle key={battleKey} auth={auth} loadout={loadout} netMatch={netMatch}
            onExit={()=>{ setNetMatch(null); setResumable(false); setScreen('home') }}
            onHome={()=>setScreen('home')}
            onGameOver={()=>setResumable(false)} />
        </div>
      )}

      {screen==='online' && <Online auth={auth} loadout={loadout} startMode={onlineMode}
        onStart={(match,role)=>{ setNetMatch({match,role}); setResumable(false); setBattleKey(k=>k+1); setScreen('battle') }}
        onBack={()=>setScreen('home')} />}
      {screen==='lead'  && <Leaderboard auth={auth} onBack={()=>setScreen('home')} onLogin={()=>setScreen('auth')} />}
      {screen==='shop'  && <Shop auth={auth} onBack={()=>setScreen('home')} />}
      {screen==='account' && <Account auth={auth} onBack={()=>setScreen('home')} onLogin={()=>setScreen('auth')} onLeaderboard={()=>setScreen('lead')} onSkins={()=>setScreen('skins')} />}
      {screen==='skins' && <SkinsScreen onBack={()=>setScreen('home')} />}
    </div>
  )
}
