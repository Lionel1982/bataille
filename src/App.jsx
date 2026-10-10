import { useState } from 'react'
import { useAuth } from './lib/useAuth.js'
import Auth from './screens/Auth.jsx'
import Build from './screens/Build.jsx'
import Battle from './screens/Battle.jsx'
import Leaderboard from './screens/Leaderboard.jsx'
import Online from './screens/Online.jsx'

export default function App(){
  const auth = useAuth()
  const [screen,setScreen] = useState('build')   // build | battle | lead | auth | online
  const [loadout,setLoadout] = useState(null)
  const [netMatch,setNetMatch] = useState(null)  // {match, role} pour une partie en ligne

  if(auth.loading) return <div className="phone"><div className="auth"><h1>⚔️</h1></div></div>

  if(screen==='auth'){
    return <div className="phone"><Auth auth={auth} onBack={()=>setScreen('build')} /></div>
  }

  const connected = auth.online && auth.session
  return (
    <div className="phone">
      {screen!=='battle' && screen!=='online' && (
        <div className="topbar">
          <button onClick={()=>setScreen('build')}>🛠️ Deck</button>
          <button onClick={()=>setScreen('lead')}>🏆 Classement</button>
          {connected
            ? <button onClick={auth.signOut}>🚪 {auth.profile?.pseudo||'Quitter'}</button>
            : <button onClick={()=>setScreen('auth')}>👤 {auth.online?'Connexion':'Compte'}</button>}
        </div>
      )}
      {screen==='build' && <Build auth={auth}
        onFight={(cfg)=>{setLoadout(cfg);setScreen('battle')}}
        onOnline={(cfg)=>{setLoadout(cfg);setScreen('online')}} />}
      {screen==='battle' && <Battle auth={auth} loadout={loadout} netMatch={netMatch}
        onExit={()=>{setNetMatch(null);setScreen('build')}} />}
      {screen==='online' && <Online auth={auth} loadout={loadout}
        onStart={(match,role)=>{ setNetMatch({match,role}); setScreen('battle') }}
        onBack={()=>setScreen('build')} />}
      {screen==='lead'  && <Leaderboard auth={auth} onBack={()=>setScreen('build')} onLogin={()=>setScreen('auth')} />}
    </div>
  )
}
