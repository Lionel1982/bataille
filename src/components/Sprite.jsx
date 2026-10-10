import { IMG } from '../assets/images.js'
export default function Sprite({ side, id, style, scale=1, flip }){
  const w = Math.round(side.cr.size*scale)
  return (
    <div className="ent" id={id} style={{display:'flex',alignItems:'flex-end',justifyContent:'center',...style}}>
      <img className={'spr'+(flip?' flip':'')} src={IMG.anim[side.key]} style={{width:w}} alt={side.cr.n}/>
    </div>
  )
}
