import { IMG } from '../assets/images.js'
import { publicSprite, onSpriteError } from '../assets/sprites.js'
import { hasCustom } from '../assets/customSprites.js'

// Oriente le familier vers l'adversaire. Joueur (mine) regarde a DROITE, adversaire a GAUCHE.
// L'AGRESSIVITE ajoute une aura de plus en plus intense autour du familier.
export default function Sprite({ side, id, style, scale=1, mine }){
  const w = Math.round(side.cr.size*scale)
  const faceLeft = side.cr.faceLeft !== false
  const flip = (faceLeft !== !mine)
  const builtinUri = IMG.anim[side.key]
  const custom = hasCustom('familiers', side.key)
  const src = custom ? publicSprite('familiers', side.key) : builtinUri
  const aggro = side.aggro||0
  const auraClass = aggro>0 ? ' aura aura'+Math.min(5,aggro) : ''
  return (
    <div className={'ent'+auraClass} id={id} data-aggro={aggro} style={{display:'flex',alignItems:'flex-end',justifyContent:'center',...style}}>
      <img className={'spr'+(flip?' flip':'')} src={src}
           onError={custom?onSpriteError(builtinUri):undefined} style={{width:w}} alt={side.cr.n}/>
    </div>
  )
}
