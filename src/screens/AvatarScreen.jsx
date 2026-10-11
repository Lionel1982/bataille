import { AVATARS, TOPS, BOTTOMS } from '../data/cards.js'
import { IMG } from '../assets/images.js'

// Ecran dedie : choix de l'avatar du joueur ET de ses fringues (poches/PV).
export default function AvatarScreen({ ld, onBack }){
  const { b, set } = ld
  return (
    <div className="screen2">
      <div className="backbar"><button onClick={onBack}>◀ Retour</button><span className="sp"/><b>👤 Mon avatar</b></div>
      <div className="s2body">
        <p className="hint">Choisis le personnage qui te represente dans l'arene.</p>
        <div className="avgrid">
          {Object.entries(AVATARS).map(([k,a])=>(
            <div key={k} className={'avbig'+(b.avatar===k?' sel':'')} onClick={()=>set({avatar:k})}>
              <img src={IMG.avatarFull[k]} alt={a.n}/><b>{a.n}</b>
            </div>
          ))}
        </div>
        <h2 className="s2h2">Tes fringues</h2>
        <p className="hint">Elles donnent des poches (stockage de cartes) et parfois des PV.</p>
        <div className="opts">{Object.entries(TOPS).map(([k,o])=>(<div key={k} className={'opt'+(b.top===k?' sel':'')} onClick={()=>set({top:k})}><div className="e">{o.i}</div><b>{o.n}·{o.pts}💰</b>{o.d}</div>))}</div>
        <div className="opts">{Object.entries(BOTTOMS).map(([k,o])=>(<div key={k} className={'opt'+(b.bottom===k?' sel':'')} onClick={()=>set({bottom:k})}><div className="e">{o.i}</div><b>{o.n}·{o.pts}💰</b>{o.d}</div>))}</div>
      </div>
      <div className="s2foot"><button className="big" onClick={onBack}>✓ VALIDER</button></div>
    </div>
  )
}
