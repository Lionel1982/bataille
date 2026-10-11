import { IMG } from '../assets/images.js'
// Oriente le familier vers l'adversaire.
// Joueur (mine=true) en bas => doit regarder a DROITE. Adversaire (mine=false) => a GAUCHE.
// L'image de base regarde a gauche si cr.faceLeft. flip = scaleX(-1).
export default function Sprite({ side, id, style, scale=1, mine }){
  const w = Math.round(side.cr.size*scale)
  const faceLeft = side.cr.faceLeft !== false   // defaut: regarde a gauche
  // on veut: joueur -> droite, adversaire -> gauche
  const wantLeft = !mine
  const flip = (faceLeft !== wantLeft)   // si l'orientation de base differe du souhait -> on retourne
  return (
    <div className="ent" id={id} style={{display:'flex',alignItems:'flex-end',justifyContent:'center',...style}}>
      <img className={'spr'+(flip?' flip':'')} src={IMG.anim[side.key]} style={{width:w}} alt={side.cr.n}/>
    </div>
  )
}
