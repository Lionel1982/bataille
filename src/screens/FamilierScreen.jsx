import { CREATURES, TOPS, BOTTOMS, FAMILIES, TRAITS } from '../data/cards.js'
import { IMG } from '../assets/images.js'

// Ecran dedie : choix du familier et des fringues (poches/PV).
export default function FamilierScreen({ ld, onBack }){
  const { b, set } = ld
  return (
    <div className="screen2">
      <div className="backbar"><button onClick={onBack}>◀ Retour</button><span className="sp"/><b style={{color:'#fff'}}>🐾 Mon familier</b></div>
      <div className="s2body">
        <p className="hint">Ton familier : ses PV, sa vitesse ⚡ et sa force 💪 definissent ton style de jeu.</p>
        <div className="grid">
          {Object.entries(CREATURES).map(([k,c])=>(
            <div key={k} className={'cre'+(b.pet===k?' sel':'')} onClick={()=>set({pet:k})}>
              <span className="pt">{c.pts}💰</span>
              <img className="ci" src={IMG.anim[k]} alt={c.n}/>
              <div className="nm">{c.n}</div>
              <span className="fam" style={{background:FAMILIES[c.f].c}}>{FAMILIES[c.f].i}</span>
              <div className="stt">❤️{c.hp} ⚡{c.spd} 💪{c.pow}</div>
              {c.t && <span className="tr">{c.t.map(t=>TRAITS[t].n).join(', ')}</span>}
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
