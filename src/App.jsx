import { useState } from 'react'
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

export default function App(){
  const auth = useAuth()
  const ld = useLoadout()
  const [screen,setScreen] = useState('home')   // home|avatar|familier|deck|battle|online|lead|shop|auth
  const [loadout,setLoadout] = useState(null)
  const [netMatch,setNetMatch] = useState(null)
  const [onlineMode,setOnlineMode] = useState('menu')  // 'create' | 'join'

  if(auth.loading) return <div className="phone"><div className="auth"><h1>⚔️</h1></div></div>
  if(screen==='auth') return <div className="phone"><Auth auth={auth} onBack={()=>setScreen('home')} /></div>

  const connected = auth.online && auth.session
  return (
    <div className="phone">
      
      {screen==='home' && <Home auth={auth} ld={ld} go={setScreen}
        onFight={(cfg)=>{ setLoadout(cfg); setNetMatch(null); setScreen('battle') }}
        onOnline={(cfg)=>{ setLoadout(cfg); setOnlineMode('create'); setScreen('online') }}
        onJoin={(cfg)=>{ setLoadout(cfg); setOnlineMode('join'); setScreen('online') }} />}

      {screen==='avatar'   && <AvatarScreen   ld={ld} onBack={()=>setScreen('home')} />}
      {screen==='familier' && <FamilierScreen ld={ld} onBack={()=>setScreen('home')} />}
      {screen==='deck'     && <DeckScreen     ld={ld} onBack={()=>setScreen('home')} />}

      {screen==='battle' && <Battle auth={auth} loadout={loadout} netMatch={netMatch}
        onExit={()=>{ setNetMatch(null); setScreen('home') }} />}
      {screen==='online' && <Online auth={auth} loadout={loadout} startMode={onlineMode}
        onStart={(match,role)=>{ setNetMatch({match,role}); setScreen('battle') }}
        onBack={()=>setScreen('home')} />}
      {screen==='lead'  && <Leaderboard auth={auth} onBack={()=>setScreen('home')} onLogin={()=>setScreen('auth')} />}
      {screen==='shop'  && <Shop auth={auth} onBack={()=>setScreen('home')} />}
      {screen==='account' && <Account auth={auth} onBack={()=>setScreen('home')} onLogin={()=>setScreen('auth')} onLeaderboard={()=>setScreen('lead')} />}
    </div>
  )
}
