import { useState, useEffect } from 'react'
import { AVATARS } from '../data/cards.js'
import { IMG } from '../assets/images.js'
import { loadManifest, allSkins, getAssignments, assignToAvatar, setDefaultSkin } from '../lib/skins.js'

// Panneau de configuration des SKINS : associe un skin (nomme librement) a un
// emplacement d'avatar (Max..Jade) ou le definit comme defaut global.
export default function SkinsScreen({ onBack }){
  const [skins,setSkins] = useState([])
  const [assign,setAssign] = useState(getAssignments())
  const [ready,setReady] = useState(false)
  const [sel,setSel] = useState(null)   // slug du skin selectionne

  useEffect(()=>{ (async()=>{ await loadManifest(); setSkins(allSkins()); setReady(true) })() },[])

  const refresh = ()=> setAssign(getAssignments())
  const slots = Object.entries(AVATARS)

  // ou est utilise ce skin ?
  const usedAt = (slug)=> slots.filter(([k])=>assign.byAvatar[k]===slug).map(([k])=>AVATARS[k].n)

  function viewUrl(slug,view){ return '/skins/'+slug+'/'+view+'.png' }
  const selSkin = skins.find(s=>s.slug===sel) || null

  return (
    <div className="screen2">
      <div className="backbar"><button onClick={onBack}>◀ Retour</button><span className="sp"/><b>🎭 Mes skins</b></div>
      <div className="s2body">
        {!ready && <p className="hint">Chargement…</p>}
        {ready && skins.length===0 && (
          <div className="skinempty">
            <p className="hint">Aucun skin pour l'instant.</p>
            <p className="hint">Depose une planche de personnage, decoupe-la (voir le prompt et le LISEZMOI dans public/sprites), et tes skins apparaitront ici.</p>
          </div>
        )}

        {ready && skins.length>0 && <>
          <p className="hint">Choisis un skin, puis dis ou l'utiliser (un avatar precis) ou mets-le en skin par defaut.</p>
          <div className="skingrid">
            {skins.map(s=>{
              const used = usedAt(s.slug)
              const isDef = assign.def===s.slug
              return (
                <div key={s.slug} className={'skincard'+(sel===s.slug?' sel':'')} onClick={()=>setSel(s.slug)}>
                  <img src={viewUrl(s.slug, (s.views||[]).includes('select')?'select':(s.views||[])[0]||'front')}
                       alt={s.name} onError={e=>{e.currentTarget.style.visibility='hidden'}}/>
                  <b>{s.name||s.slug}</b>
                  <div className="skintags">
                    {isDef && <span className="tagdef">défaut</span>}
                    {used.map(n=><span key={n} className="tagslot">{n}</span>)}
                  </div>
                </div>
              )
            })}
          </div>

          {selSkin && <div className="skinassign">
            <h3>Utiliser « {selSkin.name||selSkin.slug} »</h3>
            <p className="hint">Vues dispo : {(selSkin.views||[]).join(', ')||'—'}</p>
            <div className="assignrow">
              <button className={'abtn'+(assign.def===selSkin.slug?' on':'')}
                onClick={()=>{ setDefaultSkin(assign.def===selSkin.slug?null:selSkin.slug); refresh() }}>
                {assign.def===selSkin.slug?'✓ Skin par défaut':'Définir par défaut'}
              </button>
            </div>
            <p className="hint">…ou sur un avatar précis :</p>
            <div className="assigngrid">
              {slots.map(([k,a])=>{
                const on = assign.byAvatar[k]===selSkin.slug
                return (
                  <button key={k} className={'aslot'+(on?' on':'')}
                    onClick={()=>{ assignToAvatar(k, on?null:selSkin.slug); refresh() }}>
                    <img src={IMG.avatarFull[k]} alt={a.n}/>
                    <span>{a.n}</span>
                    {on && <span className="chk">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>}
        </>}
      </div>
      <div className="s2foot"><button className="big" onClick={onBack}>OK</button></div>
    </div>
  )
}
