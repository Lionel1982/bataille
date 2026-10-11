import { spriteFor, onSpriteError } from '../assets/sprites.js'

// Familier en vue 'front'. L'orientation gauche/droite est geree par flip (il doit regarder l'adversaire).
// L'AGRESSIVITE ajoute une aura de plus en plus intense.
export default function Sprite({ side, id, style, scale=1, mine, view='front' }){
  const w = Math.round(side.cr.size*scale)
  const faceLeft = side.cr.faceLeft !== false
  const flip = (faceLeft !== !mine)
  const { src, fallback } = spriteFor('familiers', side.key, view)
  const aggro = side.aggro||0
  const auraClass = aggro>0 ? ' aura aura'+Math.min(5,aggro) : ''
  return (
    <div className={'ent'+auraClass} id={id} data-aggro={aggro} style={{display:'flex',alignItems:'flex-end',justifyContent:'center',...style}}>
      <img className={'spr'+(flip?' flip':'')} src={src} onError={onSpriteError(fallback)} style={{width:w}} alt={side.cr.n}/>
    </div>
  )
}
