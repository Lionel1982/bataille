import { useState } from 'react'
import { useAuth } from './lib/useAuth.js'
import Auth from './screens/Auth.jsx'
import Build from './screens/Build.jsx'
import Battle from './screens/Battle.jsx'
import Leaderboard from './screens/Leaderboard.jsx'

export default function App(){
  const auth = useAuth()
  const [screen,setScreen] = useState('build')   // build | battle | lead | auth
  const [loadout,setLoadout] = useState(null)

  if(auth.loading) return <div className="phone"><div className="auth"><h1>⚔️</h1></div></div>

  // Ecran de connexion : accessible a la demande (plus jamais bloquant).
  if(screen==='auth'){
    return <div className="phone"><Auth auth={auth} onBack={()=>setScreen('build')} /></div>
  }

  const connected = auth.online && auth.session
  return (
    <div className="phone">
      {screen!=='battle' && (
        <div className="topbar">
          <button onClick={()=>setScreen('build')}>🛠️ Deck</button>
          <button onClick={()=>setScreen('lead')}>🏆 Classement</button>
          {connected
            ? <button onClick={auth.signOut}>🚪 {auth.profile?.pseudo||'Quitter'}</button>
            : <button onClick={()=>setScreen('auth')}>👤 Connexion</button>}
        </div>
      )}
      {screen==='build' && <Build auth={auth} onFight={(cfg)=>{setLoadout(cfg);setScreen('battle')}} />}
      {screen==='battle' && <Battle auth={auth} loadout={loadout} onExit={()=>setScreen('build')} />}
      {screen==='lead'  && <Leaderboard auth={auth} onBack={()=>setScreen('build')} onLogin={()=>setScreen('auth')} />}
    </div>
  )
}
