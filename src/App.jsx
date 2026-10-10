import { useState } from 'react'
import { useAuth } from './lib/useAuth.js'
import Auth from './screens/Auth.jsx'
import Build from './screens/Build.jsx'
import Battle from './screens/Battle.jsx'
import Leaderboard from './screens/Leaderboard.jsx'

export default function App(){
  const auth = useAuth()
  const [screen,setScreen] = useState('build')   // build | battle | lead
  const [loadout,setLoadout] = useState(null)      // config choisie dans Build

  if(auth.loading) return <div className="phone"><div className="auth"><h1>⚔️</h1></div></div>

  // En ligne mais pas connecte -> ecran d'auth (le mode invite reste possible)
  if(auth.online && !auth.session){
    return <div className="phone"><Auth auth={auth} /></div>
  }

  return (
    <div className="phone">
      {screen!=='battle' && (
        <div className="topbar">
          <button onClick={()=>setScreen('build')}>🛠️ Deck</button>
          <button onClick={()=>setScreen('lead')}>🏆 Classement</button>
          {auth.online && <button onClick={auth.signOut}>🚪 Quitter</button>}
        </div>
      )}
      {screen==='build' && <Build auth={auth} onFight={(cfg)=>{setLoadout(cfg);setScreen('battle')}} />}
      {screen==='battle' && <Battle auth={auth} loadout={loadout} onExit={()=>setScreen('build')} />}
      {screen==='lead' && <Leaderboard auth={auth} />}
    </div>
  )
}
