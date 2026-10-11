import { IMG } from '../assets/images.js'
import { publicSprite, onSpriteError } from '../assets/sprites.js'
import { hasCustom } from '../assets/customSprites.js'

// Oriente le familier vers l'adversaire. Joueur (mine) regarde a DROITE, adversaire a GAUCHE.
// Par defaut on affiche l'image integree (pas de requete 404). Si un sprite custom est
// enregistre pour cette cle, on prend le fichier public/sprites/familiers/<key>.png (avec repli).
export default function Sprite({ side, id, style, scale=1, mine }){
  const w = Math.round(side.cr.size*scale)
  const faceLeft = side.cr.faceLeft !== false
  const flip = (faceLeft !== !mine)
  const builtinUri = IMG.anim[side.key]
  const custom = hasCustom('familiers', side.key)
  const src = custom ? publicSprite('familiers', side.key) : builtinUri
  return (
    <div className="ent" id={id} style={{display:'flex',alignItems:'flex-end',justifyContent:'center',...style}}>
      <img className={'spr'+(flip?' flip':'')} src={src}
           onError={custom?onSpriteError(builtinUri):undefined} style={{width:w}} alt={side.cr.n}/>
    </div>
  )
}
