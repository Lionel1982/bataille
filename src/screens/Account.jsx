import { useState } from 'react'
import { online, supabase } from '../lib/supabase.js'
import { getSetting, setSetting } from '../lib/settings.js'
import { debugAddPoints } from '../lib/economy.js'

// Ecran "Mon compte" : connexion/deconnexion + acces classement + options debug.
export default function Account({ auth, onBack, onLogin, onLeaderboard, onSkins }){
  const [,force] = useState(0)
  const [msg,setMsg] = useState('')
  const connected = online && auth.session
  const tog=(k)=>{ setSetting(k,!getSetting(k)); force(x=>x+1) }

  async function addPts(){
    try{ const t=await debugAddPoints(50); setMsg('+50 points (total '+t+')') }catch(e){ setMsg(e.message) }
  }
  function resetLocal(){
    if(!confirm('Reinitialiser ton deck et tes reglages locaux ?')) return
    localStorage.removeItem('bdp_build_v5'); localStorage.removeItem('bdp_settings')
    setMsg('Deck et reglages locaux reinitialises. Recharge la page.')
  }

  return (
    <div className="screen2">
      <div className="backbar"><button onClick={onBack}>◀ Retour</button><span className="sp"/><b>👤 Mon compte</b></div>
      <div className="s2body">
        <h2 className="s2h2">Compte</h2>
        {connected
          ? <div className="acctbox">
              <div>Connecte : <b>{auth.profile?.pseudo||auth.session.user.email}</b></div>
              {auth.profile && <div className="accstat">🏆 {auth.profile.elo} ELO · {auth.profile.wins}V / {auth.profile.losses}D · 🪙 {auth.profile.shop_points||0} pts</div>}
              <button className="big" style={{marginTop:8}} onClick={auth.signOut}>🚪 Se deconnecter</button>
            </div>
          : <div className="acctbox">
              <div className="hint">{online?'Connecte-toi pour sauvegarder ta collection et jouer en ligne.':'Serveur non disponible pour le moment.'}</div>
              {online && <button className="big" onClick={onLogin}>👤 Se connecter / s inscrire</button>}
            </div>}

        <h2 className="s2h2">🏆 Classement</h2>
        <button className="big alt2" onClick={onLeaderboard}>Voir le classement</button>

        <h2 className="s2h2">🎭 Personnalisation</h2>
        <button className="big alt2" onClick={onSkins}>Gérer mes skins</button>

        <h2 className="s2h2">🛠️ Options (debug)</h2>
        <div className="optline"><span>Autoriser deck incomplet</span>
          <button className={'toggle'+(getSetting('allowIncomplete')?' on':'')} onClick={()=>tog('allowIncomplete')}>{getSetting('allowIncomplete')?'ON':'OFF'}</button></div>
        <div className="optline"><span>Logs debug (console)</span>
          <button className={'toggle'+(getSetting('debugLogs')?' on':'')} onClick={()=>tog('debugLogs')}>{getSetting('debugLogs')?'ON':'OFF'}</button></div>
        <div className="optline"><span>Points de test</span>
          <button className="smallbtn" disabled={!connected} onClick={addPts}>+50 points</button></div>
        <div className="optline"><span>Reinitialiser deck/reglages</span>
          <button className="smallbtn danger" onClick={resetLocal}>Reset</button></div>
        {msg && <div className="hint" style={{color:'#2e7d32',marginTop:6}}>{msg}</div>}
        <div className="hint" style={{marginTop:10,opacity:.6}}>Ces options de debug seront masquees dans la version finale publique.</div>
      </div>
    </div>
  )
}
