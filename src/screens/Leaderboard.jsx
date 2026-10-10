import { useEffect, useState } from 'react'
import { supabase, online } from '../lib/supabase.js'
import { IMG } from '../assets/images.js'
export default function Leaderboard({ onBack, onLogin }){
  const [rows,setRows] = useState(null)
  useEffect(()=>{
    if(!online){ setRows([]); return }
    supabase.from('leaderboard').select('*').then(({data})=> setRows(data||[]))
  },[])
  return (
    <div className="lead">
      <div className="backbar"><button onClick={onBack}>◀ Retour</button><span className="sp"/><b style={{color:'#fff'}}>🏆 Classement</b></div>
      <div className="list">
        {!online && <div style={{padding:16,textAlign:'center'}}>
          <p>Le classement en ligne demande un compte.</p>
          <button className="big" style={{maxWidth:240,marginTop:10}} onClick={onLogin}>👤 Se connecter</button>
        </div>}
        {online && rows && rows.length===0 && <p style={{padding:12}}>Personne encore. Sois le premier !</p>}
        {rows && rows.map((r,i)=>(
          <div className="rowL" key={i}>
            <span className="rk">{i+1}</span>
            <img src={IMG.avatarFull[r.avatar]||IMG.avatarFull.h1} alt="" />
            <b>{r.pseudo}</b>
            <span className="elo">{r.elo} <small style={{fontSize:11,opacity:.6}}>({r.wins}V/{r.losses}D)</small></span>
          </div>
        ))}
      </div>
    </div>
  )
}
