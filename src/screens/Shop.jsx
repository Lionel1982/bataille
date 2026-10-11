import { useEffect, useState } from 'react'
import { CARDS, FAMILIES, FOODS, shopPrice, SHOP_CARDS, BASE_COLLECTION, FINISHERS, BOOSTER_PRICE, BOOSTER_REFUND } from '../data/cards.js'
import { loadWallet, unlockCard, openBooster } from '../lib/economy.js'
import { online } from '../lib/supabase.js'

// Boutique : debloquer des cartes a l'unite OU ouvrir un booster (10 pts -> 3 cartes).
export default function Shop({ auth, onBack }){
  const [wallet,setWallet] = useState(null)
  const [busy,setBusy] = useState('')
  const [err,setErr] = useState('')
  const [reveal,setReveal] = useState(null)   // resultat booster { got, refunded }

  useEffect(()=>{ (async()=>{ setWallet(await loadWallet()) })() },[])

  if(!online || !auth.session) return (
    <div className="auth">
      <h1>BOUTIQUE</h1>
      <div className="err" style={{maxWidth:300}}>Connecte-toi pour gagner des points (victoire +3, defaite +1) et debloquer des cartes.</div>
      <button className="big" onClick={onBack}>◀ Retour</button>
    </div>
  )
  if(!wallet) return <div className="auth"><h1>BOUTIQUE</h1><div>Chargement…</div></div>

  const owned = new Set([...BASE_COLLECTION, ...(wallet.collection||[])])
  const allUnlocked = SHOP_CARDS.every(k=>owned.has(k))

  async function buy(k){
    const price=shopPrice(k); setErr('')
    if(wallet.points<price){ setErr('Pas assez de points ('+wallet.points+'/'+price+')'); return }
    setBusy(k)
    try{ const col=await unlockCard(k, price); setWallet(w=>({ points:w.points-price, collection:col })) }
    catch(e){ setErr(e.message||'Erreur') }
    setBusy('')
  }
  async function booster(){
    setErr('')
    if(wallet.points<BOOSTER_PRICE){ setErr('Pas assez de points ('+wallet.points+'/'+BOOSTER_PRICE+')'); return }
    setBusy('booster')
    try{
      const r=await openBooster(SHOP_CARDS, FINISHERS, BOOSTER_REFUND)
      setWallet({ points:r.points, collection:r.collection })
      setReveal({ got:r.got||[], refunded:r.refunded||0 })
    }catch(e){ setErr(e.message||'Erreur') }
    setBusy('')
  }

  return (
    <div className="lead">
      <div className="backbar"><button onClick={onBack}>◀ Retour</button><span className="sp"/><b style={{color:'#fff'}}>🛒 Boutique · {wallet.points} pts</b></div>

      {/* Booster */}
      <div className="boosterbox">
        <div className="binfo"><b>🎁 Booster</b><small>3 cartes au hasard · finisher rare</small></div>
        <button className="buybtn" disabled={busy==='booster'||wallet.points<BOOSTER_PRICE} onClick={booster}>{BOOSTER_PRICE} pts</button>
      </div>
      {allUnlocked && <div style={{textAlign:'center',fontSize:11,opacity:.6,padding:'2px 8px'}}>Tu as debloque toutes les cartes — un booster rembourse {BOOSTER_REFUND} pts par doublon.</div>}

      <div className="list">
        {err && <div className="err" style={{margin:8}}>{err}</div>}
        {SHOP_CARDS.map(k=>{
          const c=CARDS[k], price=shopPrice(k), have=owned.has(k)
          return (
            <div className="shoprow" key={k}>
              <span className="e">{c.art}</span>
              <div className="tx">{c.foodType?FAMILIES[c.foodType].i+' ':''}{c.big?'🔥 ':''}{c.n}<small>{c.txt}</small></div>
              {have
                ? <span className="owned">✓ Debloquee</span>
                : <button className="buybtn" disabled={busy===k||wallet.points<price} onClick={()=>buy(k)}>{price} pts</button>}
            </div>
          )
        })}
      </div>

      {/* Reveal booster */}
      {reveal && <div className="cardzoom" onClick={()=>setReveal(null)}>
        <div className="boosterreveal">
          <h3>🎁 Ton booster</h3>
          <div className="brow">
            {reveal.got.map((k,i)=>(<div className="bcard" key={i} style={{animationDelay:(i*0.15)+'s'}}><div className="art">{CARDS[k]?.art}</div><div className="nm">{CARDS[k]?.n}</div></div>))}
          </div>
          {reveal.refunded>0 && <div className="refund">+{reveal.refunded} pts remboursés (doublons)</div>}
          <button className="big" onClick={()=>setReveal(null)}>SUPER !</button>
        </div>
      </div>}
    </div>
  )
}
