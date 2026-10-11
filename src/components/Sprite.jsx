import { spriteFor, onSpriteError } from '../assets/sprites.js'

// Familier (vue 'front' par defaut). L'orientation gauche/droite est geree par flip.
// L'AGRESSIVITE ajoute une aura. className/onClick permettent le clic 3 etats (transparence/profondeur).
export default function Sprite({ side, id, style, scale=1, mine, view='front', className='', onClick }){
  const w = Math.round(side.cr.size*scale)
  const faceLeft = side.cr.faceLeft !== false
  const flip = (faceLeft !== !mine)
  const { src, fallback } = spriteFor('familiers', side.key, view)
  const aggro = side.aggro||0
  const auraClass = aggro>0 ? ' aura aura'+Math.min(5,aggro) : ''
  return (
    <div className={'ent'+auraClass+(className?' '+className:'')} id={id} data-aggro={aggro}
         onClick={onClick}
         style={{display:'flex',alignItems:'flex-end',justifyContent:'center',...style}}>
      <img className={'spr'+(flip?' flip':'')} src={src} onError={onSpriteError(fallback)} style={{width:w}} alt={side.cr.n}/>
    </div>
  )
}
