import { useEffect, useRef, useState } from 'react'
import { online } from '../lib/supabase.js'
import { createMatch, joinMatch, subscribeMatch } from '../lib/online.js'

// Lobby "partie par code" : creer (= hote, attend) ou rejoindre (= guest).
// Quand les deux sont la (status 'playing'), on appelle onStart(match, role).
export default function Online({ auth, loadout, onStart, onBack, startMode='menu' }){
  const [mode,setMode] = useState(startMode==='join'?'menu':'menu')     // menu | hosting | joining
  const [code,setCode] = useState('')
  const [input,setInput] = useState('')
  const [err,setErr] = useState('')
  const [busy,setBusy] = useState(false)
  const unsub = useRef(null)

  useEffect(()=>()=>{ if(unsub.current) unsub.current() },[])
  useEffect(()=>{ if(startMode==='create'){ host() } /* eslint-disable-next-line */ },[])

  if(!online) return (
    <div className="auth">
      <h1>JOUER EN LIGNE</h1>
      <div className="err" style={{maxWidth:300}}>🔌 Le serveur n'est pas branche sur cette version. Les parties en ligne arriveront bientot.</div>
      <button className="big" onClick={onBack}>◀ Retour</button>
    </div>
  )
  if(!auth.session) return (
    <div className="auth">
      <h1>JOUER EN LIGNE</h1>
      <div className="err" style={{maxWidth:300}}>Il faut un compte pour jouer en ligne.</div>
      <button className="big" onClick={onBack}>◀ Retour</button>
    </div>
  )

  async function host(){
    setErr(''); setBusy(true)
    try{
      const m=await createMatch(loadout.deck)
      setCode(m.code); setMode('hosting')
      // attendre que quelqu'un rejoigne
      unsub.current=subscribeMatch(m.id, (row)=>{
        if(row.status==='playing' && row.guest){ onStart(row, 'host') }
      })
    }catch(e){ setErr(e.message||'Erreur') }
    setBusy(false)
  }
  async function join(){
    setErr(''); setBusy(true)
    try{
      const m=await joinMatch(input, loadout.deck)
      onStart(m, 'guest')
    }catch(e){ setErr(e.message||'Erreur') }
    setBusy(false)
  }

  return (
    <div className="auth">
      <h1>JOUER EN LIGNE</h1>
      {mode==='menu' && <>
        <button className="big" disabled={busy} onClick={host}>➕ CREER UNE PARTIE</button>
        <div style={{opacity:.6,fontSize:13}}>— ou —</div>
        <input placeholder="CODE (4 lettres)" value={input} maxLength={4}
          onChange={e=>setInput(e.target.value.toUpperCase())} style={{textAlign:'center',letterSpacing:4,fontSize:22}}/>
        <button className="big" disabled={busy||input.length<4} onClick={join}>🔑 REJOINDRE</button>
        {err && <div className="err">{err}</div>}
        <button className="link" onClick={onBack}>◀ Retour</button>
      </>}
      {mode==='hosting' && <>
        <div style={{fontSize:15}}>Partage ce code avec ton pote :</div>
        <div style={{fontFamily:'Bangers',fontSize:64,letterSpacing:8,background:'#ffd633',border:'4px solid #111',borderRadius:16,padding:'6px 24px',boxShadow:'5px 5px 0 #111'}}>{code}</div>
        <div style={{opacity:.7}}>⏳ En attente d'un adversaire…</div>
        {err && <div className="err">{err}</div>}
        <button className="link" onClick={onBack}>Annuler</button>
      </>}
    </div>
  )
}
