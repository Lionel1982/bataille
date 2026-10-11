import { IMG } from '../assets/images.js'
import { publicSprite, onSpriteError } from '../assets/sprites.js'
// Oriente le familier vers l'adversaire. Joueur (mine) regarde a DROITE, adversaire a GAUCHE.
// Un fichier public/sprites/familiers/<key>.png remplace l'image integree s'il existe.
export default function Sprite({ side, id, style, scale=1, mine }){
  const w = Math.round(side.cr.size*scale)
  const faceLeft = side.cr.faceLeft !== false
  const wantLeft = !mine
  const flip = (faceLeft !== wantLeft)
  const builtinUri = IMG.anim[side.key]
  return (
    <div className="ent" id={id} style={{display:'flex',alignItems:'flex-end',justifyContent:'center',...style}}>
      <img className={'spr'+(flip?' flip':'')} src={publicSprite('familiers',side.key)}
           onError={onSpriteError(builtinUri)} style={{width:w}} alt={side.cr.n}/>
    </div>
  )
}
