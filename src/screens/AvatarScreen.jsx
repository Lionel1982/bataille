import { AVATARS } from '../data/cards.js'
import { IMG } from '../assets/images.js'

// Ecran dedie : choix de l'avatar du joueur.
export default function AvatarScreen({ ld, onBack }){
  const { b, set } = ld
  return (
    <div className="screen2">
      <div className="backbar"><button onClick={onBack}>◀ Retour</button><span className="sp"/><b style={{color:'#fff'}}>👤 Mon avatar</b></div>
      <div className="s2body">
        <p className="hint">Choisis le personnage qui te represente dans l'arene.</p>
        <div className="avgrid">
          {Object.entries(AVATARS).map(([k,a])=>(
            <div key={k} className={'avbig'+(b.avatar===k?' sel':'')} onClick={()=>set({avatar:k})}>
              <img src={IMG.avatarFull[k]} alt={a.n}/><b>{a.n}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="s2foot"><button className="big" onClick={onBack}>✓ VALIDER</button></div>
    </div>
  )
}
