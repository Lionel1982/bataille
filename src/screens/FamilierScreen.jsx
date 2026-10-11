import { CREATURES, FAMILIES, TRAITS } from '../data/cards.js'
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
      </div>
      <div className="s2foot"><button className="big" onClick={onBack}>✓ VALIDER</button></div>
    </div>
  )
}
