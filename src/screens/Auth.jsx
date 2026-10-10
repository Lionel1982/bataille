import { useState } from 'react'
export default function Auth({ auth, onBack }){
  const [mode,setMode] = useState('in')
  const [email,setEmail] = useState('')
  const [pw,setPw] = useState('')
  const [pseudo,setPseudo] = useState('')
  const [err,setErr] = useState('')
  const [busy,setBusy] = useState(false)

  async function go(){
    setErr(''); setBusy(true)
    const e = mode==='up' ? await auth.signUp(email,pw,pseudo) : await auth.signIn(email,pw)
    setBusy(false)
    if(e) setErr(e.message||'Erreur'); else if(onBack) onBack()
  }
  return (
    <div className="auth">
      {!auth.online && <div className="err">⚠️ Serveur non configure : connexion indisponible pour le moment.</div>}
      <h1>BATAILLE<br/>DE PO/ETS</h1>
      {mode==='up' && <input placeholder="Pseudo" value={pseudo} onChange={e=>setPseudo(e.target.value)} />}
      <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Mot de passe" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
      {err && <div className="err">{err}</div>}
      <button className="big" disabled={busy||!auth.online} onClick={go}>{mode==='up'?'CREER MON COMPTE':'SE CONNECTER'}</button>
      <button className="link" onClick={()=>setMode(mode==='up'?'in':'up')}>
        {mode==='up'?'Deja un compte ? Se connecter':'Pas de compte ? S inscrire'}
      </button>
      <button className="link" onClick={onBack}>▶ Jouer sans compte (contre l ordi)</button>
    </div>
  )
}
